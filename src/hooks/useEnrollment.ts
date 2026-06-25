import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// --- Types -------------------------------------------------------------------
export type WorkshopRow = {
  id: string;
  slug: string;
  titlu: string;
  capacity: number;
  taken: number;
};

export type GroupRow = { id: string; nume: string };
export type KidRow = { id: string; nume: string };

export type EnrollStatus =
  | "ok"
  | "full"
  | "already"
  | "closed"
  | "notfound"
  | "error";

type Config = {
  enrollmentOpen: boolean; // manual force-open override
  forceClosed: boolean; // emergency stop
  opensAt: string | null; // scheduled auto-open (ISO)
};

const POLL_MS = 5000; // fallback refresh if realtime hiccups under load

// --- Hook --------------------------------------------------------------------
export function useEnrollment() {
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [config, setConfig] = useState<Config>({
    enrollmentOpen: false,
    forceClosed: false,
    opensAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Ticking clock so the page auto-unlocks at opens_at without a reload.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Effective open state (mirrors the server-side check in aa_enroll()).
  const opensAtMs = config.opensAt ? new Date(config.opensAt).getTime() : null;
  const scheduledReached = opensAtMs != null && now >= opensAtMs;
  const isOpen = !config.forceClosed && (config.enrollmentOpen || scheduledReached);
  const msToOpen =
    opensAtMs != null && !isOpen ? Math.max(0, opensAtMs - now) : null;

  const applyConfig = useCallback(
    (row: { enrollment_open: boolean; force_closed?: boolean; opens_at: string | null }) => {
      setConfig({
        enrollmentOpen: !!row.enrollment_open,
        forceClosed: !!row.force_closed,
        opensAt: row.opens_at ?? null,
      });
    },
    []
  );

  const refetch = useCallback(async () => {
    if (!supabase) return;
    const [wRes, cRes] = await Promise.all([
      supabase.from("aa_workshops").select("id,slug,titlu,capacity,taken").order("sort"),
      supabase
        .from("aa_config")
        .select("enrollment_open,force_closed,opens_at")
        .eq("id", 1)
        .single(),
    ]);
    if (wRes.data) setWorkshops(wRes.data as WorkshopRow[]);
    if (cRes.data) applyConfig(cRes.data);
  }, [applyConfig]);

  // Initial load -------------------------------------------------------------
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setReady(false);
      return;
    }
    setReady(true);
    let cancelled = false;

    (async () => {
      const [wRes, cRes, gRes] = await Promise.all([
        supabase.from("aa_workshops").select("id,slug,titlu,capacity,taken").order("sort"),
        supabase
          .from("aa_config")
          .select("enrollment_open,force_closed,opens_at")
          .eq("id", 1)
          .single(),
        supabase.from("aa_groups").select("id,nume").order("sort"),
      ]);
      if (cancelled) return;
      if (wRes.data) setWorkshops(wRes.data as WorkshopRow[]);
      if (gRes.data) setGroups(gRes.data as GroupRow[]);
      if (cRes.data) applyConfig(cRes.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyConfig]);

  // Realtime: live spot counts + open/closed flag ----------------------------
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("aa-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "aa_workshops" },
        (payload) => {
          const row = payload.new as WorkshopRow;
          setWorkshops((curr) => curr.map((w) => (w.id === row.id ? { ...w, ...row } : w)));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "aa_config" },
        (payload) => applyConfig(payload.new as never)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyConfig]);

  // Polling fallback: even if realtime drops under load, counts stay fresh.
  useEffect(() => {
    if (!supabase) return;
    const t = setInterval(refetch, POLL_MS);
    return () => clearInterval(t);
  }, [refetch]);

  // Load the roster for a given group (lazy, on selection) -------------------
  const loadKids = useCallback(async (groupId: string): Promise<KidRow[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from("aa_kids")
      .select("id,nume")
      .eq("group_id", groupId)
      .order("nume");
    return (data as KidRow[]) ?? [];
  }, []);

  // Has this kid already enrolled? Returns the workshop slug, or null. -------
  const kidEnrollment = useCallback(async (kidId: string): Promise<string | null> => {
    if (!supabase) return null;
    const { data } = await supabase.rpc("aa_kid_enrollment", { p_kid: kidId });
    return (data as string | null) ?? null;
  }, []);

  // The atomic enrollment call ----------------------------------------------
  const enroll = useCallback(
    async (kidId: string, workshopId: string): Promise<EnrollStatus> => {
      if (!supabase) return "error";
      const { data, error } = await supabase.rpc("aa_enroll", {
        p_kid: kidId,
        p_workshop: workshopId,
      });
      if (error) {
        console.error("[aa_enroll] failed", error);
        return "error";
      }
      if (data === "ok") {
        setWorkshops((curr) =>
          curr.map((w) => (w.id === workshopId ? { ...w, taken: w.taken + 1 } : w))
        );
      }
      return (data as EnrollStatus) ?? "error";
    },
    []
  );

  return {
    workshops,
    groups,
    config,
    isOpen,
    msToOpen,
    loading,
    ready,
    loadKids,
    kidEnrollment,
    enroll,
  };
}
