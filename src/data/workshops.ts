// =============================================================================
// Trainers & workshops — display content (hardcoded).
// =============================================================================
// The `slug` of each entry MUST match a row in the aa_workshops table
// (see supabase/migrations/002_seed_workshops.sql). Capacity & live spot counts
// come from the database; everything below is just what users see.
//
// Photos: drop the real files into  public/trainers/  with the filename set in
// `photo`. The BASE_URL prefix for GitHub Pages is added automatically in the
// UI. Empty `photo` falls back to placeholder.svg.
// =============================================================================

export type Workshop = {
  slug: string; // must match aa_workshops.slug
  trainer: string; // trainer full name
  discipline: string; // short tag, e.g. "Dans"
  tagline: string; // one-line hook shown on the card (keep it short!)
  photo: string; // filename inside public/trainers/  (or "" for placeholder)
  focal?: string; // CSS object-position to keep the face in frame, e.g. "center 20%"
  bio: string; // trainer bio (may be long; shown in a details dialog)
  workshopTitle: string; // workshop name (mirror of aa_workshops.titlu)
  workshopDescription: string; // what the kids will do
};

export const WORKSHOPS: Workshop[] = [
  {
    slug: "atelier-scriere-dramatica",
    trainer: "Alex Gorghe",
    discipline: "Scriere dramatică",
    photo: "",
    bio: "",
    tagline: "Scris ca joc: de la idee la personaj și dialog.",
    workshopTitle: "Atelier de scriere dramatică",
    workshopDescription: "Detalii despre atelier în curând.",
  },
  {
    slug: "atelier-dans-filip",
    trainer: "Filip Stoica",
    discipline: "Dans",
    photo: "filip-stoica.jpg",
    focal: "center 20%",
    bio: `Filip Stoica este coregraf și artist, specializat în dans contemporan, contact improvisation și diverse stiluri de street dance. Și-a început cariera prin breakdance, iar după absolvirea secției de coregrafie a UNATC a descoperit dansul contemporan și contact improvisation, care i-au permis să exploreze noi moduri de exprimare.

A colaborat cu Centrul Național al Dansului București (CNDB), Linotip — Centru Independent Coregrafic, Teatrul Național București și Muzeul MINA, precum și cu alte teatre din București și din țară. Stilul său îmbină mișcările dinamice și acrobatice cu fluiditatea și sensibilitatea contactului fizic, în creații adesea interdisciplinare, ce integrează elemente de teatru, circ și arte vizuale.`,
    tagline: "Coordonare, improvizație și dezvoltare personală prin dans.",
    workshopTitle: "Dance as Self Discovery",
    workshopDescription: `Un atelier care combină coordonarea, introducerea în dans, dezvoltarea personală și dinamica de grup.

Obiective: îmbunătățirea coordonării fizice și mentale, familiarizarea cu elementele de bază ale mai multor stiluri de dans, creșterea încrederii în sine și a expresivității, și consolidarea spiritului de echipă.

Structura include încălzire, exerciții de coordonare și ritm, secvențe coregrafice de bază, exerciții de expresivitate și creație în grupuri mici, jocuri de dans pentru dinamica de grup și un moment final de relaxare și feedback — o abordare holistică, ce îmbină elemente fizice și emoționale.`,
  },
  {
    slug: "atelier-film",
    trainer: "Tudor Platon",
    discipline: "Film",
    photo: "tudor-platon.jpg",
    focal: "center 30%",
    bio: `Tudor Platon este regizor de documentar și director de imagine. Debutul său regizoral, „Casa cu păpuși" (2020), a avut premiera la Festivalul de Film de la Sarajevo și a fost selectat la TIFF, Zagreb Dox, Biografilm și Astra Film Festival. Al doilea lungmetraj, „O familie aproape perfectă", a avut premiera la Ji.hlava IDFF 2024, în competiția Opus Bonum.

Ca director de imagine a lucrat la peste douăzeci de filme de ficțiune și documentar, printre care „Anul Nou care n-a fost" (Premiul pentru cel mai bun film — Veneția 2024, Orizzonti), „Cadoul de Crăciun" (Premiul Academiei Europene de Film pentru scurtmetraj, 2018) și „4:15 P.M. Sfârșitul lumii" (nominalizat la Palme d'Or pentru scurtmetraj — Cannes 2016). Este membru al Academiei Europene de Film.`,
    tagline: "„Citește” imaginile — filmul ca mod de a cunoaște și a te exprima.",
    workshopTitle: "Atelier de film și imagini în mișcare",
    workshopDescription: `Atelierul urmărește deprinderea abilității de „citire" a imaginilor ca mijloc de cunoaștere, reflecție și expresie personală.

Vom lucra într-un cadru de învățare pe orizontală, unde participanții și trainerii descoperă împreună sensuri și perspective noi, cu atenția îndreptată mai mult către procesul în sine decât către un rezultat prestabilit.`,
  },
  {
    slug: "atelier-improvizatie",
    trainer: "Delia Riciu",
    discipline: "Improvizație",
    photo: "delia-riciu.jpg",
    focal: "center 25%",
    bio: `Sunt Delia Riciu și practic improvizația de 16 ani, atât ca performer, cât și ca trainer. Predau aproape zilnic și, de vreo 8 ani încoace, particip la o mulțime de festivaluri europene. În momentul de față am show-uri săptămânale la The Fool, alături de colegii din Loja Comediei.`,
    tagline: "Jocuri, greșeli asumate și energia creată împreună pe scenă.",
    workshopTitle: "Improv 101",
    workshopDescription: `La Ideo Ideis nu vin cu rețete sau reguli bătute în cuie. Vin cu jocuri. Cu exerciții. Cu întrebări. Cu energia aia specială care apare când oameni care nu se cunosc încep să creeze împreună — fără să planifice totul dinainte.

Vom explora cum funcționează improvizația pe scenă, cât de mult te poate ajuta în teatru și, poate cel mai surprinzător, cum te poate ajuta să te cunoști pe tine. O să râdem mult, o să greșim des (intenționat sau nu) și o să aflăm cum improvizația poate deveni cel mai sincer aliat al actorului.

Dacă ți se pare că „nu știi ce să spui" sau „ți-e frică să greșești" — e perfect. Ești deja unde trebuie.`,
  },
  {
    slug: "atelier-dans-teo",
    trainer: "Teo Velescu",
    discipline: "Dans",
    photo: "teo-velescu.jpg",
    focal: "center 20%",
    bio: `Teodora Velescu este coregrafă și dansatoare stabilită în București. S-a specializat în dans clasic la Liceul de Coregrafie „Floria Capsali" și a obținut licența în coregrafie și masteratul în pedagogia dansului la UNATC, unde este în prezent doctorandă în Teatru și Artele Spectacolului.

Colaborează cu instituții precum Teatrul Național București, Opera Națională București, Opera Comică pentru Copii și Centrul Național al Dansului, dar și cu companii independente (Tangaj Collective, Vanner Collective, Linotip). A performat în festivaluri naționale și internaționale și a curatoriat primele două ediții ale festivalului HazarDance, parte din Romanian Creative Week.`,
    tagline: "Mișcare, auto-conștientizare și creație colectivă prin dans.",
    workshopTitle: "Ție cum îți place să te miști?",
    workshopDescription: `Când te gândești la mișcare, care este prima imagine care-ți apare în minte? Te vezi pe tine, o formă abstractă, sau poate o salcie într-o zi ploioasă? Nu există răspunsuri greșite — dansul poate cuprinde atât de multe universuri, pentru că se naște din noi, oamenii. Iar noi, deși suntem diferiți, tot prin dans suntem aduși împreună.

Acest atelier este menit să ne aducă împreună — minte, trup, suflet, dar și om cu om — prin exerciții de auto-conștientizare, improvizație și creație colectivă.

Imaginație, inspirație, emoție, creație, vocație, meditație, vibrație — ție cum îți place să te miști?`,
  },
  {
    slug: "atelier-costume",
    trainer: "Șteff Chelaru",
    discipline: "Costume",
    photo: "steff-chelaru.jpg",
    focal: "center 25%",
    bio: `Șteff Chelaru a absolvit Moda la Facultatea de Arte Decorative și Design (UNArte București), licență și master, apoi scenografia la UNATC „I.L. Caragiale" (2022). A colaborat cu Teatrul Național București, Teatrul Odeon, Teatrul Metropolis, Teatrul Mic, unteatru, Opera Națională București, ARCUB, Teatrul „Andrei Mureșanu" Sfântu Gheorghe, Teatrul German de Stat Timișoara și Teatrul Masca.

Pentru ea contează enorm comunicarea și sinceritatea celuilalt om din echipă, mai ales relația cu regizorul — o colaborare repetată până ajung la același limbaj vizual și emoțional. „Sunt, de fapt, colegi de emoții teatrale."`,
    tagline: "Styling și personalitate prin accesorizare — un proces de modă în mic.",
    workshopTitle: "Atelierul de costum / modă",
    workshopDescription: `Un atelier simplu, creativ și la modă, despre styling și conturarea personalității adolescentine prin vestimentație.

Prima zi e de acomodare și prezentare. Apoi fiecare participant primește câte un element (o pălărie, un guler victorian sau un sacou negru) căruia trebuie să-i dea o personalitate proprie prin accesorizare — mărgele, pene, dantelă, cusături, texturi. Urmează finalizarea produsului gândit și styling pentru fiecare, iar la final o ședință foto într-o locație potrivită.

În pași mari și într-un timp foarte scurt, atelierul parcurge procesul unei creații de modă.`,
  },
];
