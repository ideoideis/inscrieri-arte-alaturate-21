import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, Radio, Star, Users, X } from "lucide-react";
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
const MAX_PICKS = 3;

type Saved = {
  kidId: string;
  kidName: string;
  groupId: string;
  groupName: string;
  enrolledSlug: string | null;
  picks: string[];
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
    picks: [],
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

  const [picks, setPicks] = useState<string[]>([]);
  const [pendingClaim, setPendingClaim] = useState<string[] | null>(null);
  const [detailsSlug, setDetailsSlug] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState<string | null>(null);

  // Restore identity + picks from this device.
  useEffect(() => {
    const s = loadSaved();
    if (s) {
      setGroupId(s.groupId);
      setKidId(s.kidId);
      setEnrolledSlug(s.enrolledSlug);
      setPicks(s.picks ?? []);
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

  const togglePick = (slug: string) => {
    setPicks((curr) => {
      let next: string[];
      if (curr.includes(slug)) next = curr.filter((s) => s !== slug);
      else if (curr.length >= MAX_PICKS) {
        toast.info(`Poți alege maximum ${MAX_PICKS} ateliere.`);
        return curr;
      } else next = [...curr, slug];
      saveSaved({ picks: next });
      return next;
    });
  };

  const stateFor = (slug: string) => {
    const row: WorkshopRow | undefined = workshops.find((x) => x.slug === slug);
    const capacity = row?.capacity ?? 0;
    const taken = row?.taken ?? 0;
    const remaining = Math.max(0, capacity - taken);
    const full = capacity > 0 && remaining <= 0;
    return { row, capacity, taken, remaining, full };
  };

  const succeed = (slug: string) => {
    setEnrolledSlug(slug);
    saveSaved({ enrolledSlug: slug });
    setJustEnrolled(slug);
    setPendingClaim(null);
    setDetailsSlug(null);
  };

  // Claim in order of preference; fall back to the next pick if one is full.
  const claimWithFallback = async (slugs: string[]) => {
    if (!kidId || claiming) return;
    setClaiming(true);
    try {
      for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        const { row } = stateFor(slug);
        if (!row) continue;
        const status = await enroll(kidId, row.id);
        const title = WORKSHOPS.find((w) => w.slug === slug)?.workshopTitle ?? slug;
        if (status === "ok") {
          succeed(slug);
          toast.success(`Te-ai înscris la ${title}! 🎉`);
          return;
        }
        if (status === "already") {
          const cur = await kidEnrollment(kidId);
          setEnrolledSlug(cur);
          if (cur) saveSaved({ enrolledSlug: cur });
          toast.info("Ești deja înscris/ă la un atelier.");
          setPendingClaim(null);
          return;
        }
        if (status === "closed") {
          toast.error("Înscrierile nu sunt deschise în acest moment.");
          setPendingClaim(null);
          return;
        }
        if (status === "full") {
          const more = i < slugs.length - 1;
          toast.info(`${title} s-a umplut${more ? " — încercăm următoarea alegere…" : "."}`);
          continue;
        }
        toast.error("A apărut o eroare. Mai încearcă o dată.");
        setPendingClaim(null);
        return;
      }
      // All chosen workshops are full.
      toast.error("Toate alegerile tale s-au umplut. Alege rapid un atelier cu locuri libere.");
      setPendingClaim(null);
      document.getElementById("ateliere")?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setClaiming(false);
    }
  };

  const opensAtText = useMemo(() => fmtOpensAt(config.opensAt), [config.opensAt]);
  const kidName = kids.find((k) => k.id === kidId)?.nume ?? loadSaved()?.kidName ?? "";
  const enrolledWorkshop = WORKSHOPS.find((w) => w.slug === enrolledSlug);
  const detailsWorkshop = WORKSHOPS.find((w) => w.slug === detailsSlug);
  const pendingWorkshops = (pendingClaim ?? [])
    .map((s) => WORKSHOPS.find((w) => w.slug === s))
    .filter(Boolean) as Workshop[];

  // The pick we'll actually try first (skip ones already visibly full).
  const nextPick = picks.find((s) => !stateFor(s).full) ?? picks[0] ?? null;
  const nextPickWorkshop = WORKSHOPS.find((w) => w.slug === nextPick);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  // ---- Supabase not configured -------------------------------------------
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
          <span className="red-line mx-auto mt-6 w-24" style={{ background: "white" }} />
          <p className="mt-8 text-lg opacity-95">
            Atelierul tău: <strong>{enrolledWorkshop.workshopTitle}</strong>
            <br />
            <span className="opacity-80">cu {enrolledWorkshop.trainer}</span>
          </p>
          <p className="mt-4 text-sm opacity-80">
            Te poți înscrie la un singur atelier — locul tău e rezervat. Ne vedem acolo!
          </p>
          <Button
            variant="secondary"
            className="mt-8"
            onClick={() => setJustEnrolled(null)}
          >
            Înapoi la pagină
          </Button>
        </div>
      </main>
    );
  }

  // ---- Sticky bar content -------------------------------------------------
  const renderStickyBar = () => {
    let content;
    if (!kidId) {
      content = (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-sm font-medium">Pasul 1: spune-ne cine ești</span>
          <Button size="sm" variant="secondary" onClick={() => scrollTo("identitate")}>
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
            {nextPickWorkshop ? (
              <>Prima alegere: <strong>{nextPickWorkshop.workshopTitle}</strong></>
            ) : (
              <span className="opacity-80">Alege-ți atelierele preferate ↑</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
            <Clock className="h-4 w-4" />
            {msToOpen != null ? fmtCountdown(msToOpen) : "în curând"}
          </span>
        </div>
      );
    } else if (nextPickWorkshop) {
      content = (
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold"
          disabled={claiming}
          onClick={() => setPendingClaim(picks)}
        >
          {claiming ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Se înscrie…
            </span>
          ) : (
            `ÎNSCRIE-MĂ LA ${nextPickWorkshop.workshopTitle.toUpperCase()}`
          )}
        </Button>
      );
    } else {
      content = (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-sm font-medium">Înscrierile sunt deschise — alege un atelier!</span>
          <Button size="sm" variant="secondary" onClick={() => scrollTo("ateliere")}>
            Vezi atelierele
          </Button>
        </div>
      );
    }
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-secondary text-secondary-foreground">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-3 flex items-center">{content}</div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
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
          Descoperă atelierele și trainerii din acest an. Marchează-ți acum atelierele
          preferate (până la 3) — când se deschid înscrierile, te înscriem dintr-o atingere
          la prima cu locuri libere. Fiecare participant se poate înscrie la un singur atelier.
        </p>

        {/* Status + countdown banner */}
        <div
          className={cn(
            "mt-8 border p-4 md:p-5 flex items-start gap-3",
            isOpen ? "border-primary bg-primary/5" : "border-border bg-muted"
          )}
        >
          <span
            className={cn(
              "mt-1 h-2.5 w-2.5 shrink-0",
              isOpen ? "bg-primary animate-pulse" : "bg-muted-foreground"
            )}
            style={{ borderRadius: "9999px" }}
          />
          <div className="flex-1">
            {isOpen ? (
              <p className="font-semibold">Înscrierile sunt DESCHISE — înscrie-te acum!</p>
            ) : (
              <>
                <p className="font-semibold">Înscrierile nu sunt încă deschise.</p>
                {opensAtText && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Se deschid: <strong>{opensAtText}</strong>. Pagina se activează automat.
                  </p>
                )}
                {msToOpen != null && (
                  <p className="mt-2 inline-flex items-center gap-2 text-2xl md:text-3xl font-bold tabular-nums">
                    <Clock className="h-6 w-6 text-primary" />
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
        <div className="border bg-secondary text-secondary-foreground p-5 md:p-6">
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
              <CheckCircle2 className="h-4 w-4 text-primary" />
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
              ✓ Gata, <strong>{kidName}</strong>! Pasul 2: marchează-ți atelierele preferate mai jos.
            </p>
          )}
        </div>
      </section>

      {/* Workshops */}
      <section id="ateliere" className="max-w-6xl mx-auto px-6 md:px-10 mt-12 scroll-mt-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Pasul 2 · Atelierele
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Apasă <Star className="inline h-3.5 w-3.5" /> ca să-ți marchezi preferatele (max {MAX_PICKS}, în ordine).
        </p>
        <span className="red-line mt-4 w-16" />

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Se încarcă atelierele…
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WORKSHOPS.map((w) => {
              const s = stateFor(w.slug);
              const hasDetails = !!w.bio;
              const isMine = enrolledSlug === w.slug;
              const pickRank = picks.indexOf(w.slug);
              const isPicked = pickRank >= 0;
              const lockedOut = !!enrolledSlug && !isMine;
              return (
                <article
                  key={w.slug}
                  className={cn(
                    "border flex flex-col bg-card relative",
                    isMine && "ring-2 ring-primary",
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
                    {isPicked && !isMine && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1">
                        Alegerea ta #{pickRank + 1}
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
                    <p className="mt-2 text-sm leading-relaxed line-clamp-3 whitespace-pre-line">
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

                    <div className="mt-4 flex flex-col gap-2">
                      {isMine ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary border border-primary">
                          <CheckCircle2 className="h-4 w-4" /> Ești înscris/ă aici
                        </div>
                      ) : (
                        <>
                          {!enrolledSlug && (
                            <Button
                              variant={isPicked ? "default" : "outline"}
                              className="w-full"
                              onClick={() => togglePick(w.slug)}
                            >
                              {isPicked ? (
                                <span className="inline-flex items-center gap-2">
                                  <Star className="h-4 w-4 fill-current" /> Alegerea ta #{pickRank + 1}
                                  <X className="h-3.5 w-3.5 opacity-80" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2">
                                  <Star className="h-4 w-4" /> Vreau la acest atelier
                                </span>
                              )}
                            </Button>
                          )}
                          {isOpen && !lockedOut && (
                            <Button
                              variant="secondary"
                              className="w-full"
                              disabled={s.full || claiming}
                              onClick={() => setPendingClaim([w.slug])}
                            >
                              {s.full ? "Locuri epuizate" : "Înscrie-mă direct"}
                            </Button>
                          )}
                        </>
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
      <AlertDialog open={!!pendingClaim} onOpenChange={(o) => !o && setPendingClaim(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmi înscrierea?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingWorkshops.length > 1 ? (
                  <>
                    Te înscriem la prima opțiune cu locuri libere, în ordine:
                    <ol className="mt-2 list-decimal list-inside font-medium text-foreground">
                      {pendingWorkshops.map((w) => (
                        <li key={w.slug}>{w.workshopTitle}</li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <>
                    Te vei înscrie la{" "}
                    <strong className="text-foreground">{pendingWorkshops[0]?.workshopTitle}</strong>.
                  </>
                )}
                <p className="mt-3">
                  Atenție: te poți înscrie la un singur atelier și nu mai poți schimba după confirmare.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={claiming}>Renunț</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingClaim) claimWithFallback(pendingClaim);
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

  // Local helper that needs component scope.
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
