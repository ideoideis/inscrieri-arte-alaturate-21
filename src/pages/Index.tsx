import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, Radio, Users } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEnrollment, type KidRow, type WorkshopRow } from "@/hooks/useEnrollment";
import { WORKSHOPS, type Workshop } from "@/data/workshops";
import etichetaLogo from "@/assets/eticheta-ideoideis.png";

const LS_KEY = "aa21_kid";

type Saved = {
  kidId: string;
  kidName: string;
  groupId: string;
  groupName: string;
  enrolledSlug: string | null;
  pick: string | null;
};

const loadSaved = (): Saved | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};
const saveSaved = (patch: Partial<Saved>) => {
  const cur = loadSaved() ?? {
    kidId: "",
    kidName: "",
    groupId: "",
    groupName: "",
    enrolledSlug: null,
    pick: null,
  };
  localStorage.setItem(LS_KEY, JSON.stringify({ ...cur, ...patch }));
};

const photoSrc = (w: Workshop) =>
  w.photo
    ? `${import.meta.env.BASE_URL}trainers/${w.photo}`
    : `${import.meta.env.BASE_URL}placeholder.svg`;

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

const fmtCountdown = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}z ${p(h)}:${p(m)}:${p(s)}`;
  return `${p(h)}:${p(m)}:${p(s)}`;
};

export default function Index() {
  const { workshops, groups, config, isOpen, msToOpen, loading, ready, loadKids, kidEnrollment, enroll } =
    useEnrollment();

  const [groupId, setGroupId] = useState("");
  const [kids, setKids] = useState<KidRow[]>([]);
  const [kidId, setKidId] = useState("");
  const [kidsLoading, setKidsLoading] = useState(false);

  const [enrolledSlug, setEnrolledSlug] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [pick, setPick] = useState<string | null>(null); // single favorite
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [detailsSlug, setDetailsSlug] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState<string | null>(null);

  // Restore identity + favorite from this device.
  useEffect(() => {
    const s = loadSaved();
    if (s) {
      setGroupId(s.groupId);
      setKidId(s.kidId);
      setEnrolledSlug(s.enrolledSlug);
      setPick(s.pick ?? null);
      if (s.groupId) loadKids(s.groupId).then(setKids);
    }
  }, [loadKids]);

  const handleGroupChange = async (value: string) => {
    setGroupId(value);
    setKidId("");
    setEnrolledSlug(null);
    saveSaved({ groupId: value, kidId: "", kidName: "", enrolledSlug: null });
    setKidsLoading(true);
    setKids(await loadKids(value));
    setKidsLoading(false);
  };

  const handleKidChange = async (value: string) => {
    setKidId(value);
    setChecking(true);
    const slug = await kidEnrollment(value);
    setEnrolledSlug(slug);
    setChecking(false);
    const groupName = groups.find((g) => g.id === groupId)?.nume ?? "";
    const kidName = kids.find((k) => k.id === value)?.nume ?? "";
    saveSaved({ kidId: value, kidName, groupId, groupName, enrolledSlug: slug });
  };

  // Single favorite — tap to choose, tap again to clear (radio-style).
  const choose = (slug: string) => {
    const next = pick === slug ? null : slug;
    setPick(next);
    saveSaved({ pick: next });
  };

  const stateFor = (slug: string) => {
    const row: WorkshopRow | undefined = workshops.find((x) => x.slug === slug);
    const capacity = row?.capacity ?? 0;
    const taken = row?.taken ?? 0;
    const remaining = Math.max(0, capacity - taken);
    const full = capacity > 0 && remaining <= 0;
    return { row, capacity, taken, remaining, full };
  };

  const claim = async (slug: string) => {
    if (!kidId || claiming) return;
    const { row } = stateFor(slug);
    if (!row) return;
    setClaiming(true);
    const status = await enroll(kidId, row.id);
    setClaiming(false);
    setPendingSlug(null);
    const title = WORKSHOPS.find((w) => w.slug === slug)?.workshopTitle ?? slug;
    switch (status) {
      case "ok":
        setEnrolledSlug(slug);
        saveSaved({ enrolledSlug: slug });
        setJustEnrolled(slug);
        setDetailsSlug(null);
        break;
      case "full":
        toast.error(`${title} s-a umplut — alege rapid alt atelier.`);
        document.getElementById("ateliere")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "already": {
        const cur = await kidEnrollment(kidId);
        setEnrolledSlug(cur);
        if (cur) saveSaved({ enrolledSlug: cur });
        toast.info("Ești deja înscris/ă la un atelier.");
        break;
      }
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
  const detailsWorkshop = WORKSHOPS.find((w) => w.slug === detailsSlug);
  const pendingWorkshop = WORKSHOPS.find((w) => w.slug === pendingSlug);
  const pickWorkshop = WORKSHOPS.find((w) => w.slug === pick);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  // ---- Supabase not configured -------------------------------------------
  if (!ready && !loading) {
    return (
      <main className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <span className="micro-label">Ateliere de Arte Alăturate</span>
          <h1 className="mt-3 text-3xl font-bold">Configurare necesară</h1>
          <p className="mt-4 opacity-90">
            Lipsesc variabilele Supabase. Creează un fișier <code>.env</code> cu{" "}
            <code>VITE_SUPABASE_URL</code> și <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </main>
    );
  }

  // ---- Full-screen success ------------------------------------------------
  if (justEnrolled && enrolledWorkshop) {
    return (
      <main className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-xl">
          <CheckCircle2 className="mx-auto h-16 w-16" />
          <span className="micro-label mt-6 block">Înscriere confirmată</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            {kidName ? `${kidName}, ` : ""}ești înscris/ă!
          </h1>
          <span className="block h-0.5 w-24 bg-white mx-auto mt-6" />
          <p className="mt-8 text-lg opacity-95">
            Atelierul tău: <strong>{enrolledWorkshop.workshopTitle}</strong>
            <br />
            <span className="opacity-80">cu {enrolledWorkshop.trainer}</span>
          </p>
          <p className="mt-4 text-sm opacity-80">
            Te poți înscrie la un singur atelier — locul tău e rezervat. Ne vedem acolo!
          </p>
          <Button variant="secondary" className="mt-8" onClick={() => setJustEnrolled(null)}>
            Înapoi la pagină
          </Button>
        </div>
      </main>
    );
  }

  // ---- Sticky bar ---------------------------------------------------------
  const renderStickyBar = () => {
    let content: JSX.Element;
    if (!kidId) {
      content = (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-sm font-medium">Pasul 1: spune-ne cine ești</span>
          <Button size="sm" onClick={() => scrollTo("identitate")}>
            Alege grupa & numele
          </Button>
        </div>
      );
    } else if (enrolledWorkshop) {
      content = (
        <div className="flex items-center gap-2 w-full justify-center font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          Ești înscris/ă la: {enrolledWorkshop.workshopTitle}
        </div>
      );
    } else if (!isOpen) {
      content = (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-sm">
            <strong>{kidName}</strong>, ești gata.{" "}
            {pickWorkshop ? (
              <>Atelierul tău: <strong>{pickWorkshop.workshopTitle}</strong></>
            ) : (
              <span className="opacity-80">Alege-ți atelierul ↑</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
            <Clock className="h-4 w-4" />
            {msToOpen != null ? fmtCountdown(msToOpen) : "în curând"}
          </span>
        </div>
      );
    } else if (pickWorkshop && !stateFor(pickWorkshop.slug).full) {
      content = (
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold"
          disabled={claiming}
          onClick={() => setPendingSlug(pickWorkshop.slug)}
        >
          {claiming ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Se înscrie…
            </span>
          ) : (
            `ÎNSCRIE-MĂ LA ${pickWorkshop.workshopTitle.toUpperCase()}`
          )}
        </Button>
      );
    } else {
      content = (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-sm font-medium">
            {pickWorkshop ? "Atelierul tău s-a umplut — alege altul!" : "Înscrierile sunt deschise — alege un atelier!"}
          </span>
          <Button size="sm" onClick={() => scrollTo("ateliere")}>
            Vezi atelierele
          </Button>
        </div>
      );
    }
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/15 bg-secondary text-secondary-foreground">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-3 flex items-center">{content}</div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-primary text-primary-foreground pb-28">
      {/* Header */}
      <header className="border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between gap-4">
          <div className="inline-block bg-white p-2">
            <img src={etichetaLogo} alt="Festivalul ideo ideis" className="h-12 w-auto md:h-14" />
          </div>
          {ready && (
            <span className="hidden sm:inline-flex items-center gap-2 micro-label">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
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
        <span className="block h-0.5 w-24 bg-white mt-6" />
        <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed opacity-95">
          Descoperă atelierele și trainerii. Alege-ți acum atelierul preferat — când se
          deschid înscrierile, te înscrii dintr-o singură atingere. Locurile sunt limitate
          și fiecare participant se poate înscrie la un singur atelier.
        </p>

        {/* Status + countdown banner */}
        <div
          className={cn(
            "mt-8 border p-4 md:p-5 flex items-start gap-3",
            isOpen ? "border-white bg-white text-primary" : "border-white/30 bg-white/10"
          )}
        >
          <span
            className={cn("mt-1.5 h-2.5 w-2.5 shrink-0", isOpen ? "bg-primary animate-pulse" : "bg-white")}
            style={{ borderRadius: "9999px" }}
          />
          <div className="flex-1">
            {isOpen ? (
              <p className="font-bold text-lg">Înscrierile sunt DESCHISE — înscrie-te acum!</p>
            ) : (
              <>
                <p className="font-semibold">Înscrierile nu sunt încă deschise.</p>
                {opensAtText && (
                  <p className="text-sm opacity-90 mt-0.5">
                    Se deschid: <strong>{opensAtText}</strong>. Pagina se activează automat.
                  </p>
                )}
                {msToOpen != null && (
                  <p className="mt-2 inline-flex items-center gap-2 text-3xl md:text-4xl font-bold tabular-nums">
                    <Clock className="h-7 w-7" />
                    {fmtCountdown(msToOpen)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Identity panel */}
      <section id="identitate" className="max-w-6xl mx-auto px-6 md:px-10 mt-10 scroll-mt-4">
        <div className="border border-white/15 bg-secondary text-secondary-foreground p-5 md:p-6">
          <h2 className="text-lg font-semibold">Pasul 1 · Cine ești?</h2>
          <p className="text-sm opacity-80 mt-1">
            Alege grupa și numele tău — fă asta din timp ca să fii gata la deschidere.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <label className="micro-label block mb-2">Grupa</label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="bg-background text-foreground h-12">
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
              <Select value={kidId} onValueChange={handleKidChange} disabled={!groupId || kidsLoading}>
                <SelectTrigger className="bg-background text-foreground h-12">
                  <SelectValue
                    placeholder={
                      !groupId ? "Alege întâi grupa" : kidsLoading ? "Se încarcă…" : "Alege-ți numele"
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

          {kidId && enrolledWorkshop && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {kidName ? `${kidName}, ești` : "Ești"} înscris/ă la:{" "}
              <strong>{enrolledWorkshop.workshopTitle}</strong>
            </div>
          )}
          {kidId && checking && (
            <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificăm înscrierea…
            </div>
          )}
          {kidId && !enrolledWorkshop && !checking && (
            <p className="mt-4 text-sm opacity-90">
              ✓ Gata, <strong>{kidName}</strong>! Pasul 2: alege-ți atelierul mai jos.
            </p>
          )}
        </div>
      </section>

      {/* Workshops */}
      <section id="ateliere" className="max-w-6xl mx-auto px-6 md:px-10 mt-12 scroll-mt-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pasul 2 · Alege-ți atelierul</h2>
        <p className="mt-2 text-sm opacity-90">
          Apasă pe atelierul dorit ca să-l alegi. Când se deschid înscrierile, te înscrii cu un singur tap.
        </p>
        <span className="block h-0.5 w-16 bg-white mt-4" />

        {loading ? (
          <div className="mt-10 flex items-center gap-2 opacity-90">
            <Loader2 className="h-5 w-5 animate-spin" /> Se încarcă atelierele…
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WORKSHOPS.map((w) => {
              const s = stateFor(w.slug);
              const hasDetails = !!w.bio;
              const isMine = enrolledSlug === w.slug;
              const isPick = pick === w.slug;
              const lockedOut = !!enrolledSlug && !isMine;
              return (
                <article
                  key={w.slug}
                  className={cn(
                    "border flex flex-col bg-card text-card-foreground relative",
                    (isMine || isPick) && "ring-4 ring-white",
                    s.full && !isMine && "opacity-60"
                  )}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    <img
                      src={photoSrc(w)}
                      alt={w.trainer}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `${import.meta.env.BASE_URL}placeholder.svg`;
                      }}
                    />
                    {isPick && !isMine && (
                      <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1">
                        ✓ Atelierul tău
                      </span>
                    )}
                    {s.full && !isMine && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/45">
                        <span className="border-2 border-white text-white font-bold tracking-widest text-lg px-4 py-2 -rotate-6">
                          LOCURI EPUIZATE
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="micro-label">{w.trainer}</span>
                      <span className="text-[0.6rem] uppercase tracking-wider font-semibold bg-primary text-primary-foreground px-2 py-0.5">
                        {w.discipline}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold leading-tight">{w.workshopTitle}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-line">
                      {w.workshopDescription}
                    </p>
                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() => setDetailsSlug(w.slug)}
                        className="mt-2 self-start text-sm font-semibold text-primary underline underline-offset-2"
                      >
                        Vezi detalii
                      </button>
                    )}

                    <div className="mt-5 pt-1">{renderSpots(w.slug)}</div>

                    <div className="mt-4">
                      {isMine ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary border border-primary">
                          <CheckCircle2 className="h-4 w-4" /> Ești înscris/ă aici
                        </div>
                      ) : lockedOut ? (
                        <div className="py-2 text-center text-sm text-muted-foreground">
                          Te-ai înscris la alt atelier
                        </div>
                      ) : isOpen ? (
                        <Button
                          className="w-full"
                          disabled={s.full || claiming}
                          onClick={() => setPendingSlug(w.slug)}
                        >
                          {s.full ? "Locuri epuizate" : "Înscrie-mă"}
                        </Button>
                      ) : (
                        <Button
                          variant={isPick ? "default" : "outline"}
                          className="w-full"
                          onClick={() => choose(w.slug)}
                        >
                          {isPick ? (
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Atelierul tău
                            </span>
                          ) : (
                            "Aleg acest atelier"
                          )}
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

      {/* Details dialog */}
      <Dialog open={!!detailsSlug} onOpenChange={(o) => !o && setDetailsSlug(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailsWorkshop && (
            <>
              <DialogHeader>
                <span className="micro-label">
                  {detailsWorkshop.trainer} · {detailsWorkshop.discipline}
                </span>
                <DialogTitle className="text-2xl">{detailsWorkshop.workshopTitle}</DialogTitle>
              </DialogHeader>
              {detailsWorkshop.photo && (
                <img
                  src={photoSrc(detailsWorkshop)}
                  alt={detailsWorkshop.trainer}
                  className="w-full aspect-[16/9] object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `${import.meta.env.BASE_URL}placeholder.svg`;
                  }}
                />
              )}
              {detailsWorkshop.bio && (
                <div>
                  <h4 className="micro-label">Despre trainer</h4>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                    {detailsWorkshop.bio}
                  </p>
                </div>
              )}
              <div>
                <h4 className="micro-label">Despre atelier</h4>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                  {detailsWorkshop.workshopDescription}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <AlertDialog open={!!pendingSlug} onOpenChange={(o) => !o && setPendingSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmi înscrierea?</AlertDialogTitle>
            <AlertDialogDescription>
              {kidName ? <strong>{kidName}</strong> : "Te înscrii"}, te vei înscrie la{" "}
              <strong className="text-foreground">{pendingWorkshop?.workshopTitle}</strong>. Te poți
              înscrie la un singur atelier și nu mai poți schimba după confirmare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={claiming}>Renunț</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingSlug) claim(pendingSlug);
              }}
              disabled={claiming}
            >
              {claiming ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Se înscrie…
                </span>
              ) : (
                "Da, mă înscriu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {renderStickyBar()}
    </main>
  );

  function renderSpots(slug: string) {
    const s = stateFor(slug);
    return (
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" /> Locuri
          </span>
          <span className={cn("font-semibold", s.full && "text-primary")}>
            {s.full ? "Epuizate" : `${s.remaining} din ${s.capacity} libere`}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: s.capacity > 0 ? `${(s.taken / s.capacity) * 100}%` : "0%" }}
          />
        </div>
      </div>
    );
  }
}
