import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Radio, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEnrollment, type KidRow } from "@/hooks/useEnrollment";
import { WORKSHOPS } from "@/data/workshops";
import etichetaLogo from "@/assets/eticheta-ideoideis.png";

const LS_KEY = "aa21_kid";

type Saved = {
  kidId: string;
  kidName: string;
  groupId: string;
  groupName: string;
  enrolledSlug: string | null;
};

const loadSaved = (): Saved | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};

// Romanian date/time, e.g. "vineri, 27 iunie, 18:00"
const fmtOpensAt = (iso: string | null): string | null => {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return null;
  }
};

export default function Index() {
  const { workshops, groups, config, loading, ready, loadKids, kidEnrollment, enroll } =
    useEnrollment();

  // Identity selection
  const [groupId, setGroupId] = useState("");
  const [kids, setKids] = useState<KidRow[]>([]);
  const [kidId, setKidId] = useState("");
  const [kidsLoading, setKidsLoading] = useState(false);

  // Which workshop slug this kid is enrolled in (null = not yet)
  const [enrolledSlug, setEnrolledSlug] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Confirm dialog
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Restore a previously identified kid from this device.
  useEffect(() => {
    const s = loadSaved();
    if (s) {
      setGroupId(s.groupId);
      setKidId(s.kidId);
      setEnrolledSlug(s.enrolledSlug);
    }
  }, []);

  // When a group is picked, load its roster.
  const handleGroupChange = async (value: string) => {
    setGroupId(value);
    setKidId("");
    setEnrolledSlug(null);
    setKidsLoading(true);
    setKids(await loadKids(value));
    setKidsLoading(false);
  };

  // When a kid is picked, check whether they already have a spot.
  const handleKidChange = async (value: string) => {
    setKidId(value);
    setChecking(true);
    const slug = await kidEnrollment(value);
    setEnrolledSlug(slug);
    setChecking(false);

    const groupName = groups.find((g) => g.id === groupId)?.nume ?? "";
    const kidName = kids.find((k) => k.id === value)?.nume ?? "";
    const saved: Saved = { kidId: value, kidName, groupId, groupName, enrolledSlug: slug };
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  };

  const persistEnrolled = (slug: string) => {
    const s = loadSaved();
    if (s) localStorage.setItem(LS_KEY, JSON.stringify({ ...s, enrolledSlug: slug }));
  };

  const doEnroll = async () => {
    if (!pendingSlug || !kidId) return;
    const w = workshops.find((x) => x.slug === pendingSlug);
    if (!w) return;
    setSubmitting(true);
    const status = await enroll(kidId, w.id);
    setSubmitting(false);
    setPendingSlug(null);

    switch (status) {
      case "ok":
        setEnrolledSlug(pendingSlug);
        persistEnrolled(pendingSlug);
        toast.success("Te-ai înscris cu succes! 🎉");
        break;
      case "full":
        toast.error("Ne pare rău — locurile tocmai s-au ocupat.");
        break;
      case "already":
        // Someone (maybe another device) already used this kid.
        toast.info("Ești deja înscris/ă la un atelier.");
        kidEnrollment(kidId).then((s) => {
          setEnrolledSlug(s);
          if (s) persistEnrolled(s);
        });
        break;
      case "closed":
        toast.error("Înscrierile nu sunt deschise în acest moment.");
        break;
      default:
        toast.error("A apărut o eroare. Mai încearcă o dată.");
    }
  };

  const opensAtText = useMemo(() => fmtOpensAt(config.opensAt), [config.opensAt]);
  const kidName = kids.find((k) => k.id === kidId)?.nume ?? loadSaved()?.kidName ?? "";
  const enrolledWorkshop = WORKSHOPS.find((w) => w.slug === enrolledSlug);
  const pendingWorkshop = WORKSHOPS.find((w) => w.slug === pendingSlug);

  // --- Supabase not configured (local dev without .env) --------------------
  if (!ready && !loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <span className="micro-label">Ateliere de Arte Alăturate</span>
          <h1 className="mt-3 text-3xl font-bold">Configurare necesară</h1>
          <p className="mt-4 text-muted-foreground">
            Lipsesc variabilele Supabase. Creează un fișier <code>.env</code> cu{" "}
            <code>VITE_SUPABASE_URL</code> și <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between gap-4">
          <div className="inline-block bg-white">
            <img src={etichetaLogo} alt="Festivalul ideo ideis" className="h-14 w-auto md:h-16" />
          </div>
          {ready && (
            <span className="hidden sm:inline-flex items-center gap-2 micro-label">
              <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
              Locuri actualizate în timp real
            </span>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-10 md:pt-14">
        <span className="micro-label">Festivalul ideo ideis #21</span>
        <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight">
          Ateliere de Arte Alăturate
        </h1>
        <span className="red-line mt-6 w-24" />
        <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
          Descoperă atelierele și trainerii din acest an. Alege-ți atelierul preferat —
          când se deschid înscrierile, îți rezervi locul direct de aici. Atenție: locurile
          sunt limitate și fiecare participant se poate înscrie la un singur atelier.
        </p>

        {/* Status banner */}
        <div
          className={cn(
            "mt-8 border p-4 md:p-5 flex items-start gap-3",
            config.enrollmentOpen
              ? "border-primary bg-primary/5"
              : "border-border bg-muted"
          )}
        >
          <span
            className={cn(
              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
              config.enrollmentOpen ? "bg-primary animate-pulse" : "bg-muted-foreground"
            )}
            style={{ borderRadius: "9999px" }}
          />
          <div>
            <p className="font-semibold">
              {config.enrollmentOpen
                ? "Înscrierile sunt DESCHISE — alege-ți atelierul mai jos."
                : "Înscrierile nu sunt încă deschise."}
            </p>
            {!config.enrollmentOpen && opensAtText && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Se deschid: <strong>{opensAtText}</strong>. Pagina se va activa automat.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Identity panel */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10">
        <div className="border bg-secondary text-secondary-foreground p-5 md:p-6">
          <h2 className="text-lg font-semibold">Cine ești?</h2>
          <p className="text-sm opacity-80 mt-1">
            Selectează grupa și numele tău ca să te poți înscrie.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <label className="micro-label block mb-2">Grupa</label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Alege grupa" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nume}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="micro-label block mb-2">Numele tău</label>
              <Select
                value={kidId}
                onValueChange={handleKidChange}
                disabled={!groupId || kidsLoading}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue
                    placeholder={
                      !groupId
                        ? "Alege întâi grupa"
                        : kidsLoading
                        ? "Se încarcă..."
                        : "Alege-ți numele"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {kids.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nume}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Already-enrolled confirmation */}
          {kidId && enrolledWorkshop && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {kidName ? `${kidName}, ești` : "Ești"} înscris/ă la:{" "}
              <strong>{enrolledWorkshop.workshopTitle}</strong>
            </div>
          )}
          {kidId && checking && (
            <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificăm înscrierea...
            </div>
          )}
        </div>
      </section>

      {/* Workshops */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Atelierele</h2>
        <span className="red-line mt-4 w-16" />

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Se încarcă atelierele...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WORKSHOPS.map((w) => {
              const row = workshops.find((x) => x.slug === w.slug);
              const capacity = row?.capacity ?? 0;
              const taken = row?.taken ?? 0;
              const remaining = Math.max(0, capacity - taken);
              const full = capacity > 0 && remaining <= 0;
              const isMine = enrolledSlug === w.slug;
              const photoSrc = w.photo
                ? `${import.meta.env.BASE_URL}trainers/${w.photo}`
                : `${import.meta.env.BASE_URL}placeholder.svg`;

              // Button state
              const lockedByOtherChoice = !!enrolledSlug && !isMine;
              const canEnroll =
                config.enrollmentOpen && !!kidId && !enrolledSlug && !full;

              return (
                <article
                  key={w.slug}
                  className={cn(
                    "border flex flex-col bg-card",
                    isMine && "ring-2 ring-primary"
                  )}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={photoSrc}
                      alt={w.trainer}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="micro-label">{w.trainer}</span>
                    <h3 className="mt-2 text-xl font-bold leading-tight">
                      {w.workshopTitle}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {w.bio}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed">{w.workshopDescription}</p>

                    {/* Live spots */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" /> Locuri
                        </span>
                        <span className={cn("font-semibold", full && "text-primary")}>
                          {full ? "Epuizate" : `${remaining} din ${capacity} libere`}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: capacity > 0 ? `${(taken / capacity) * 100}%` : "0%",
                          }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-5 pt-1">
                      {isMine ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary border border-primary">
                          <CheckCircle2 className="h-4 w-4" /> Ești înscris/ă aici
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          disabled={!canEnroll}
                          onClick={() => setPendingSlug(w.slug)}
                        >
                          {!config.enrollmentOpen
                            ? "Înscrieri închise"
                            : full
                            ? "Locuri epuizate"
                            : lockedByOtherChoice
                            ? "Ai ales deja alt atelier"
                            : !kidId
                            ? "Alege-ți numele mai sus"
                            : "Mă înscriu"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirm dialog */}
      <AlertDialog open={!!pendingSlug} onOpenChange={(o) => !o && setPendingSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmi înscrierea?</AlertDialogTitle>
            <AlertDialogDescription>
              {kidName ? <strong>{kidName}</strong> : "Te înscrii"}, te vei înscrie la{" "}
              <strong>{pendingWorkshop?.workshopTitle}</strong>. Atenție: te poți înscrie la
              un singur atelier și nu mai poți schimba după confirmare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Renunț</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                doEnroll();
              }}
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Se înscrie...
                </span>
              ) : (
                "Da, mă înscriu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
