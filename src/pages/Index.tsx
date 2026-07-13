import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  };
  localStorage.setItem(LS_KEY, JSON.stringify({ ...cur, ...patch }));
};

const photoSrc = (w: Workshop) =>
  w.photo
    ? `${import.meta.env.BASE_URL}trainers/${w.photo}`
    : `${import.meta.env.BASE_URL}placeholder.svg`;

// Variante mai mici (-480/-720, generate cu sips) pentru telefoane pe date mobile.
const photoSrcSet = (w: Workshop) => {
  if (!w.photo) return undefined;
  const dir = `${import.meta.env.BASE_URL}trainers/`;
  const stem = w.photo.replace(/\.jpg$/, "");
  return `${dir}${stem}-480.jpg 480w, ${dir}${stem}-720.jpg 720w, ${dir}${w.photo} 900w`;
};

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

// Multi-paragraph copy as clean, separated blocks (not a wall of text).
function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className="space-y-4">
      {text
        .split(/\n{2,}/)
        .map((para, i) => (
          <p key={i} className={cn("leading-relaxed whitespace-pre-line", className)}>
            {para.trim()}
          </p>
        ))}
    </div>
  );
}

// Small red inline label ("tema ta:", "ce să aduci:").
function Chip({ children }: { children: string }) {
  return (
    <span className="inline-block bg-primary text-primary-foreground text-sm px-1.5 py-0.5 mr-2 align-baseline whitespace-nowrap">
      {children}
    </span>
  );
}

// White pill link, ca pe pagina #20 ("înapoi la ateliere ›").
function PillLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="inline-block bg-white text-primary text-sm font-semibold px-6 py-2.5 hover:bg-white/90 transition-colors"
    >
      {children}
    </a>
  );
}

type Spots = {
  row: WorkshopRow | undefined;
  capacity: number;
  taken: number;
  remaining: number;
  full: boolean;
};

// O secțiune albă per atelier. Ca pagina să nu fie kilometrică, arată doar
// esențialul (titlu, locuri, primul paragraf, poza, trainerul); restul
// (descrierea completă, tema, ce să aduci, bio) stă sub „citește mai mult”.
function WorkshopBlock({ w, spots }: { w: Workshop; spots: Spots }) {
  const [open, setOpen] = useState(false);

  // Deschide automat blocul când e țintit prin ancoră (#slug), din lista de
  // ateliere sau din link-ul „tema ta de pregătit” de după înscriere.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === `#${w.slug}`) setOpen(true);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [w.slug]);

  const [teaser, ...restParts] = w.workshopDescription.split(/\n{2,}/);
  const rest = restParts.join("\n\n");

  return (
    <section id={w.slug} className="bg-background text-foreground scroll-mt-4">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <h2 className="text-4xl md:text-6xl font-bold text-primary leading-[1.05]">
          {w.discipline.toLowerCase()}
        </h2>

        <div className="mt-8 md:mt-12 grid gap-8 md:gap-12 md:grid-cols-[1fr,17rem] lg:grid-cols-[1fr,19rem]">
          {/* Stânga: atelierul */}
          <div>
            <h3 className="text-xl md:text-2xl text-primary leading-snug">{w.workshopTitle}</h3>
            {spots.row && (
              <p className="mt-2 text-sm text-muted-foreground">
                {spots.full ? (
                  <span className="text-primary font-semibold">Locurile s-au epuizat.</span>
                ) : (
                  `${spots.remaining} din ${spots.capacity} locuri libere`
                )}
              </p>
            )}

            <p className="mt-6 leading-relaxed whitespace-pre-line">{teaser.trim()}</p>

            {open && (
              <>
                {rest && (
                  <div className="mt-4">
                    <Paragraphs text={rest} />
                  </div>
                )}

                {w.task && (
                  <div className="mt-7 border-l-2 border-primary bg-primary/5 p-4 md:p-5">
                    <p className="mb-4">
                      <Chip>tema ta:</Chip>
                      <span className="text-sm text-muted-foreground">
                        de pregătit de cei care se înscriu la acest atelier
                      </span>
                    </p>
                    <Paragraphs text={w.task} />
                  </div>
                )}

                {w.bring && (
                  <p className="mt-6 leading-relaxed">
                    <Chip>ce să aduci:</Chip>
                    {w.bring}
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-5 inline-flex items-center text-primary font-semibold"
            >
              {open ? "arată mai puțin ↑" : "citește mai mult ↓"}
            </button>
          </div>

          {/* Dreapta: trainerul */}
          <aside>
            <img
              src={photoSrc(w)}
              srcSet={photoSrcSet(w)}
              sizes="(min-width: 768px) 19rem, calc(100vw - 3rem)"
              alt={w.trainer}
              loading="lazy"
              decoding="async"
              className="w-full aspect-[3/4] object-cover bg-muted"
              onError={(e) => {
                e.currentTarget.srcset = "";
                e.currentTarget.src = `${import.meta.env.BASE_URL}placeholder.svg`;
              }}
            />
            {w.photoCredit && (
              <p className="mt-1.5 text-xs text-muted-foreground">foto: {w.photoCredit}</p>
            )}
            <p className="mt-6 text-sm text-muted-foreground">trainer:</p>
            <p className="mt-0.5 text-lg font-semibold text-primary">{w.trainer}</p>
            {open && (
              <div className="mt-3">
                <Paragraphs text={w.bio} className="text-sm text-muted-foreground" />
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { workshops, groups, config, isOpen, msToOpen, loading, ready, loadKids, kidEnrollment, enroll } =
    useEnrollment();

  const [groupId, setGroupId] = useState("");
  const [kids, setKids] = useState<KidRow[]>([]);
  const [kidId, setKidId] = useState("");
  const [kidsLoading, setKidsLoading] = useState(false);

  const [enrolledSlug, setEnrolledSlug] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [selectedSlug, setSelectedSlug] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Ascunde pastila plutitoare când formularul e deja pe ecran.
  const [formInView, setFormInView] = useState(false);
  useEffect(() => {
    const el = document.getElementById("inscriere");
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, [ready]);

  useEffect(() => {
    const s = loadSaved();
    if (!s) return;
    setGroupId(s.groupId);
    setKidId(s.kidId);
    setEnrolledSlug(s.enrolledSlug);
    if (s.groupId) loadKids(s.groupId).then(setKids);
    // Starea „ești înscris/ă” din localStorage e doar un cache: adevărul e în
    // baza de date (înscrierile de test se șterg), deci o re-verificăm la
    // fiecare încărcare și corectăm ce am afișat optimist mai sus.
    if (s.kidId) {
      setChecking(true);
      kidEnrollment(s.kidId).then((slug) => {
        setEnrolledSlug(slug);
        saveSaved({ enrolledSlug: slug });
        setChecking(false);
      });
    }
  }, [loadKids, kidEnrollment]);

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

  const stateFor = (slug: string): Spots => {
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
    setConfirming(false);
    const title = WORKSHOPS.find((w) => w.slug === slug)?.workshopTitle ?? slug;
    switch (status) {
      case "ok":
        setEnrolledSlug(slug);
        saveSaved({ enrolledSlug: slug });
        break;
      case "full":
        toast.error(`${title} s-a umplut. Alege rapid alt atelier.`);
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
  const selectedWorkshop = WORKSHOPS.find((w) => w.slug === selectedSlug);

  // ---- Supabase not configured -------------------------------------------
  if (!ready && !loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold">Configurare necesară</h1>
          <p className="mt-3 leading-relaxed">
            Lipsesc variabilele Supabase. Creează un fișier <code>.env</code> cu{" "}
            <code>VITE_SUPABASE_URL</code> și <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </main>
    );
  }

  const missingStep = !kidId
    ? "Alege-ți întâi trupa și numele."
    : !selectedSlug
      ? "Alege un atelier din listă."
      : null;

  return (
    <main className="min-h-screen bg-primary">
      {/* ============================== HERO (roșu) ============================== */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          {/* eticheta, lipită de marginea de sus, la fel ca pe info-trupe-21 */}
          <div className="inline-block bg-white p-3 md:p-4">
            <img src={etichetaLogo} alt="Festivalul ideo ideis" className="h-20 w-auto md:h-24" />
          </div>

          <h1 className="mt-10 md:mt-20 text-4xl md:text-6xl font-bold leading-tight">
            înscrieri:
            <br />
            ateliere arte alăturate
          </h1>

          <div className="mt-8 md:mt-10 max-w-xl space-y-4 text-base md:text-lg">
            <p className="leading-relaxed">
              Ediția #21 a Festivalului aduce șase ateliere de arte alăturate: scriere
              dramatică, dans, actorie de film, costume și film.
            </p>
            <p className="leading-relaxed">
              Citește mai jos despre ateliere și înscrie-te la cel potrivit pentru tine.
            </p>
            <p className="leading-relaxed opacity-95">
              Numărul de locuri pentru fiecare atelier este limitat, iar locurile se ocupă în
              ordinea înscrierilor. Fiecare participant se poate înscrie la un singur atelier.
              <br />
              {">>>"} grăbește-te să prinzi loc la atelierul dorit!
            </p>
            {isOpen ? (
              <p className="leading-relaxed font-semibold">
                Înscrierile sunt deschise!{" "}
                <a href="#inscriere" className="underline underline-offset-4">
                  Mergi la formular ↓
                </a>
              </p>
            ) : (
              opensAtText && (
                <p className="leading-relaxed">
                  Formularul se deschide automat, {opensAtText}
                  {msToOpen != null && (
                    <>
                      {" ("}
                      <span className="tabular-nums font-semibold">{fmtCountdown(msToOpen)}</span>
                      {")"}
                    </>
                  )}
                  .
                </p>
              )
            )}
          </div>
        </div>

        {/* Lista atelierelor */}
        <nav id="lista" className="max-w-4xl mx-auto px-6 md:px-10 pt-12 pb-14 md:pt-16 md:pb-20 scroll-mt-4">
          <p className="text-sm text-center opacity-90">
            Mai jos este o listă cu atelierele de anul acesta, ca să poți naviga ușor.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
            {WORKSHOPS.map((w) => (
              <li key={w.slug}>
                <a
                  href={`#${w.slug}`}
                  className="flex items-center justify-between gap-3 bg-white text-primary px-5 py-4 hover:bg-white/90 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-base md:text-lg font-bold leading-snug">
                      {w.discipline.toLowerCase()}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{w.trainer}</span>
                  </span>
                  <span aria-hidden className="shrink-0 text-2xl font-bold">
                    ›
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ======================= ATELIERELE (secțiuni albe) ====================== */}
      {WORKSHOPS.map((w) => (
        <Fragment key={w.slug}>
          <WorkshopBlock w={w} spots={stateFor(w.slug)} />

          {/* Bandă roșie de separare */}
          <div className="bg-primary py-8 md:py-10 px-6 text-center">
            <PillLink href="#lista">înapoi la ateliere ›</PillLink>
          </div>
        </Fragment>
      ))}

      {/* ==================== ÎNSCRIEREA (secțiune închisă) ===================== */}
      <section id="inscriere" className="bg-secondary text-secondary-foreground scroll-mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-12 md:py-24">
          <div className="max-w-xl mx-auto bg-card text-card-foreground p-5 sm:p-6 md:p-9">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">înscrie-te</h2>

            {!isOpen && (
              <div className="mt-5 border border-border p-4 md:p-5">
                <p className="leading-relaxed">
                  Înscrierile <strong>nu sunt încă deschise</strong>.
                  {opensAtText && <> Formularul se activează automat, {opensAtText}.</>}
                </p>
                {msToOpen != null && (
                  <p className="mt-2 text-3xl md:text-4xl font-semibold tabular-nums text-primary">
                    {fmtCountdown(msToOpen)}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Îți poți alege trupa și numele de pe acum, ca să fii gata la deschidere.
                </p>
              </div>
            )}

            {loading ? (
              <div className="mt-6 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Se încarcă…
              </div>
            ) : enrolledWorkshop ? (
              <div className="mt-6 border border-primary p-5">
                <p className="flex items-center gap-2 font-semibold text-primary">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  {kidName ? `${kidName}, ești înscris/ă!` : "Ești înscris/ă!"}
                </p>
                <p className="mt-2 leading-relaxed">
                  Atelierul tău: <strong>{enrolledWorkshop.workshopTitle}</strong> cu{" "}
                  {enrolledWorkshop.trainer}. Locul tău e rezervat. Ne vedem la festival!
                </p>
                {enrolledWorkshop.task && (
                  <p className="mt-2 leading-relaxed">
                    Nu uita de{" "}
                    <a
                      href={`#${enrolledWorkshop.slug}`}
                      className="text-primary underline underline-offset-4"
                    >
                      tema ta de pregătit ↑
                    </a>
                    .
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-7">
                {/* 1–2: cine ești */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2">1. Trupa ta</label>
                    <Select value={groupId} onValueChange={handleGroupChange}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Alege trupa" />
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
                    <label className="block text-sm font-semibold mb-2">2. Numele tău</label>
                    <Select
                      value={kidId}
                      onValueChange={handleKidChange}
                      disabled={!groupId || kidsLoading}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue
                          placeholder={
                            !groupId
                              ? "Alege întâi trupa"
                              : kidsLoading
                                ? "Se încarcă…"
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
                {kidId && checking && (
                  <p className="-mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificăm înscrierea…
                  </p>
                )}

                {/* 3: atelierul */}
                <div>
                  <label className="block text-sm font-semibold mb-2">3. Atelierul dorit</label>
                  <RadioGroup value={selectedSlug} onValueChange={setSelectedSlug} className="gap-2">
                    {WORKSHOPS.map((w) => {
                      const s = stateFor(w.slug);
                      return (
                        <label
                          key={w.slug}
                          htmlFor={`opt-${w.slug}`}
                          className={cn(
                            "flex items-center gap-3 border border-border p-3.5 cursor-pointer transition-colors",
                            selectedSlug === w.slug && "border-primary ring-1 ring-primary",
                            s.full && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <RadioGroupItem value={w.slug} id={`opt-${w.slug}`} disabled={s.full} />
                          <span className="flex-1 min-w-0">
                            <span className="block font-semibold leading-snug">
                              {w.workshopTitle}
                            </span>
                            <span className="block text-sm text-muted-foreground">
                              {w.discipline} · {w.trainer}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "text-sm whitespace-nowrap",
                              s.full ? "text-primary font-semibold" : "text-muted-foreground"
                            )}
                          >
                            {s.row ? (s.full ? "Epuizat" : `${s.remaining} libere`) : ""}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>

                <div>
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    disabled={!isOpen || !kidId || !selectedSlug || claiming || checking}
                    onClick={() => setConfirming(true)}
                  >
                    {isOpen ? "Înscrie-mă" : "Formularul nu e încă deschis"}
                  </Button>
                  {isOpen && missingStep && (
                    <p className="mt-2 text-sm text-muted-foreground">{missingStep}</p>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">
                    Te poți înscrie la un singur atelier și nu poți schimba alegerea după
                    confirmare.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm opacity-75">
            Locurile se actualizează în timp real, nu e nevoie să reîncarci pagina.
          </p>
        </div>
      </section>

      {/* Pastilă plutitoare pe mobil, apare doar când înscrierile sunt deschise */}
      {isOpen && !enrolledWorkshop && !formInView && (
        <a
          href="#inscriere"
          aria-label="Mergi la formularul de înscriere"
          className="md:hidden fixed right-4 z-40 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-2.5 shadow-lg"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          înscrie-te ↓
        </a>
      )}

      {/* Confirmare finală */}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmi înscrierea?</AlertDialogTitle>
            <AlertDialogDescription>
              {kidName ? <strong>{kidName}</strong> : "Te înscrii"}, te vei înscrie la{" "}
              <strong className="text-foreground">{selectedWorkshop?.workshopTitle}</strong> cu{" "}
              {selectedWorkshop?.trainer}. Te poți înscrie la un singur atelier și nu mai poți
              schimba după confirmare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={claiming}>Renunț</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (selectedSlug) claim(selectedSlug);
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
    </main>
  );
}
