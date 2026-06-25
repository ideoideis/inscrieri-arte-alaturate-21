import { useCallback, useEffect, useRef, useState } from "react";
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

type Config = { enrollmentOpen: boolean; opensAt: string | null };

// --- Hook --------------------------------------------------------------------
export function useEnrollment() {
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [config, setConfig] = useState<Config>({
    enrollmentOpen: false,
    opensAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false); // false when Supabase isn't configured

  // Avoid stale closures inside the realtime callback.
  const workshopsRef = useRef<WorkshopRow[]>([]);
  workshopsRef.current = workshops;

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
        supabase.from("aa_config").select("enrollment_open,opens_at").eq("id", 1).single(),
        supabase.from("aa_groups").select("id,nume").order("sort"),
      ]);
      if (cancelled) return;
      if (wRes.data) setWorkshops(wRes.data as WorkshopRow[]);
      if (gRes.data) setGroups(gRes.data as GroupRow[]);
      if (cRes.data) {
        setConfig({
          enrollmentOpen: !!cRes.data.enrollment_open,
          opensAt: cRes.data.opens_at ?? null,
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
          setWorkshops((curr) =>
            curr.map((w) => (w.id === row.id ? { ...w, ...row } : w))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "aa_config" },
        (payload) => {
          const row = payload.new as { enrollment_open: boolean; opens_at: string | null };
          setConfig({
            enrollmentOpen: !!row.enrollment_open,
            opensAt: row.opens_at ?? null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      // Optimistically reflect the new count; realtime will reconcile too.
      if (data === "ok") {
        setWorkshops((curr) =>
          curr.map((w) => (w.id === workshopId ? { ...w, taken: w.taken + 1 } : w))
        );
      }
      return (data as EnrollStatus) ?? "error";
    },
    []
  );

  return { workshops, groups, config, loading, ready, loadKids, kidEnrollment, enroll };
}
