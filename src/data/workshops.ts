// =============================================================================
// Trainers & workshops — display content (hardcoded).
// =============================================================================
// The `slug` of each entry MUST match a row in the aa_workshops table
// (see supabase/migrations/002_seed_workshops.sql). Capacity & live spot counts
// come from the database; everything below is just what users see.
//
// Order here = order on the page (mirrors ideoideis.ro/…/arte-alaturate-21).
//
// Photos: drop the real files into  public/trainers/  with the filename set in
// `photo`. The BASE_URL prefix for GitHub Pages is added automatically in the
// UI. Empty `photo` falls back to placeholder.svg.
// =============================================================================

export type Workshop = {
  slug: string; // must match aa_workshops.slug
  trainer: string; // trainer full name
  discipline: string; // short tag, e.g. "Dans"
  photo: string; // filename inside public/trainers/  (or "" for placeholder)
  photoCredit?: string; // photographer, shown as "foto: …"
  bio: string; // trainer bio (shown under "trainer:")
  workshopTitle: string; // workshop name (mirror of aa_workshops.titlu)
  workshopDescription: string; // what the kids will do
  task?: string; // prep task for kids who enroll — highlighted on the page
  bring?: string; // what participants must pack ("ce să aduci:")
};

export const WORKSHOPS: Workshop[] = [
  {
    slug: "atelier-scriere-dramatica",
    trainer: "Alex Gorghe",
    discipline: "Scriere dramatică",
    photo: "alex-gorghe.jpg",
    photoCredit: "Matei Bumbuț",
    bio: `Alex Gorghe este un tânăr dramaturg român, absolvent al licenței de teatru aplicat din cadrul Royal Central School of Speech and Drama din Londra și al masterului de Scriere Dramatică din cadrul UNATC „I.L. Caragiale” București.

Prin textele lui explorează realitatea socio-politică actuală, urmărind teme economice, relații de putere și felul în care oamenii negociază conflicte personale și colective. Piesele lui au fost dezvoltate și montate atât în teatre independente, cât și în instituții publice.`,
    workshopTitle: "Atelier de scriere dramatică",
    workshopDescription: `Teatrul trebuie să se pregătească pentru noile generații de spectatori — un public care nu a crescut cu povești structurate în narative clasice, realiste, ci o audiență care a copilărit înconjurată de convențiile suprarealiste ale desenelor animate, de poveștile din jocurile video și de narativele fragmentate din meme-urile de pe rețelele sociale.

Acest atelier de scriere dramatică este o invitație la experiment — o invitație de a explora noi structuri și ritmuri dramatice, create pentru publicul tânăr de astăzi. Vom concepe fragmente și idei de piese pornind de la întrebări precum „dacă am merge la teatru, ce ne-ar distra și interesa pe mine și pe prietenii mei?”, „cum arată un teatru făcut pentru attention span-ul oamenilor de astăzi?” și „ce subiecte ni se mai par importante de abordat în contextul socio-politic actual?”.

Deci, dacă te interesează cum ar putea arăta imaginația generației tale într-un text de teatru, hai să experimentăm asta împreună!`,
    task: `Scrie un dialog de 3 pagini între 2–3 personaje, în care:
1. Cel puțin unul dintre personaje este un personaj dintr-un desen animat care îți e familiar;
2. Subiectul scenei este legat de o problemă care te preocupă în lumea în care trăim;
3. Personajele pot discuta și amabil, stând pur și simplu la un ceai în sufragerie, dar te încurajăm să găsești situații mai alerte, care să dea scenei o miză mai mare.

Câteva exemple, doar ca să fie mai clar ce ai de făcut (nu le reface pe astea):
• Scooby-Doo și Velma din Gașca Misterelor vor să oprească criza climatică — sunt în Vama Veche și cercetează cine aruncă plastic și deșeuri în mare;
• Finn și Jake din Adventure Time dezbat cu Prințesa Bubblegum despre prinții misogini din ținut — e ziua pețitului, pe prințesă o enervează toți pețitorii, iar Jake se duelează cu un voinic care îi face apropouri nesimțite;
• Peter Griffin și Stewie din Family Guy sunt la directorul grădiniței lui Stewie — Peter află că fiul lui își face de un an temele doar cu AI, iar cei trei dezbat dacă asta e sau nu OK.`,
  },
  {
    // Logistică pentru organizatori (nu se afișează): boxă bluetooth, apă,
    // sală potrivită de dans.
    slug: "atelier-dans-eduard",
    trainer: "Eduard Chimac",
    discipline: "Dans",
    photo: "eduard-chimac.jpg",
    photoCredit: "Sabina Costinel",
    bio: `Eduard Chimac este absolvent al secției Arta Actorului la UNATC „I.L. Caragiale” București și face parte din proiecte independente și de stat încă din primul an de facultate. A jucat în spectacole la Teatrul Mic, Teatrul Bulandra, Teatrul Național București, Teatrul Excelsior, ARCUB, Teatrul Metropolis, Sala Luceafărul, WASP și Teatrul Masca.

Prezent și în lumea dansului, este performer în spectacole de teatru-dans și dans contemporan și a lucrat cu coregrafi precum Andrea Gavriliu, Ștefan Lupu, Mariana Gavriciuc, Vlad Furtună și Anastasia Preotu. Cel mai cunoscut spectacol în care joacă în prezent este „Cine l-a ucis pe tata?”, în regia lui Andrei Măjeri; ca dansator îl poți vedea în „Rave de Ravel”, „Cea mai bună zi din an (Nu uita să încui!)”, „Wet dreams (ARE MADE OF THIS)” și „Gro(o)ve”.`,
    workshopTitle: "WHAT IF?",
    workshopDescription: `What if? este o întrebare simplă, dar care poate schimba complet felul în care alegem să ne mișcăm.

Pornind din practica mea de actor, această întrebare devine punctul de plecare al cercetării. Nu căutăm răspunsuri, ci posibilități. Ce se întâmplă atunci când schimbăm intenția? Energia? Ritmul? Relația cu spațiul, cu ceilalți sau cu noi înșine? Ce se întâmplă atunci când renunțăm la ceea ce știm și permitem corpului să surprindă?

Workshopul propune un proces de explorare prin improvizație și sarcini fizice, în care fiecare participant își poate extinde propriul limbaj de mișcare. Parcursul meu artistic reunește actoria, breakingul, acrobația, dansul contemporan și teatrul fizic — aceste influențe nu definesc o estetică de reprodus, ci oferă un teren comun de cercetare, din care fiecare își poate construi propriul răspuns corporal.

What if? este o invitație de a privi fiecare alegere ca pe începutul unei noi posibilități.`,
    bring: `Haine comode (nu pantaloni scurți), șosete lungi de schimb și o bluză cu mânecă lungă.`,
  },
  {
    // Temă de înscriere: trainerul revine cu ea — de completat în `task`.
    slug: "atelier-actorie-film",
    trainer: "Theodor Ioniță",
    discipline: "Actorie de film",
    photo: "theodor-ionita.jpg",
    photoCredit: "arhivă proprie",
    bio: `Născut la Iași, Theodor a studiat istoria artei de mic, ambii săi părinți fiind profesori universitari. A absolvit licența și masteratul de regie de film la UNATC „I.L. Caragiale” București, unde a scris și regizat scurtmetrajele „In a family” (2020), „Malice Aforethought” (2021), „Mihail and Achim” (2021) și „My sister and I” (2021) — selecționate la Sarajevo, TIFF, Anonimul (premiul „Ovidiu Bose Paștină”, 2021), Gopo, CineMed Montpellier, Premiers Plans Angers și San Francisco Film Festival.

A filmat primul scurtmetraj cu finanțare CNC și lucrează ca scenarist la un serial TV în dezvoltare; regizează, de asemenea, reclame și videoclipuri. În paralel cu filmul, a studiat pian clasic și percuție timp de 14 ani — este producător muzical și artist sub numele Pvardo și director artistic al proiectului LUSA.`,
    workshopTitle: "Atelier de actorie de film pentru adolescenți — Meisner & Weston",
    workshopDescription: `Atelierul se axează pe construcția unui comportament autentic în fața camerei.

Combinăm și studiem pe scurt tehnica lui Sanford Meisner (ascultare reală, reacție instinctivă, exercițiul de repetiție) cu metoda de indicații regizorale pentru actori a lui Judith Weston (verb activ vs. adjectiv).`,
  },
  {
    slug: "atelier-costume",
    trainer: "Șteff Chelaru",
    discipline: "Costume",
    photo: "steff-chelaru.jpg",
    photoCredit: "Mihai Smeu",
    bio: `Șteff Chelaru a absolvit Moda la Facultatea de Arte Decorative și Design (UNArte București), licență și master, apoi scenografia la UNATC „I.L. Caragiale” (2022). A colaborat cu Teatrul Național București, Teatrul Odeon, Teatrul Metropolis, Teatrul Mic, unteatru, Opera Națională București, ARCUB, Teatrul „Andrei Mureșanu” Sfântu Gheorghe, Teatrul German de Stat Timișoara, Teatrul Masca și Teatrul Bulandra.

Este un scenograf la început de drum — o lume pe care o descoperă cu interes, învățând cu fiecare proiect că are propria sa răsuflare, emoție și propriul său mesaj. De fapt, fiecare lume pe care o creează împreună cu regizorul este lumea comună pentru prezentul de atunci — dar peste puțin timp, aceeași lume are o altă semnificație… Ce efemer este universul teatral!`,
    workshopTitle: "Blugii de toate zilele sunt salvatorii nevăzuți",
    workshopDescription: `Un atelier simplu, creativ și la modă. Tinerii de azi sunt tot mai atenți la outfituri cu un styling diferit, care să le contureze personalitatea — iar atelierul acesta parcurge, în pași mari și într-un timp foarte scurt, drumul unui întreg proces de modă.

Prima zi e de acomodare și prezentare. Apoi, fiecare participant va lucra pe două perechi de blugi, cărora trebuie să le dea o personalitate proprie prin accesorizare — ținte, ace de siguranță, mesaje scrise, mărgele, pene, dantelă, cusături, texturi. În fiecare zi există câte o mică temă pentru acasă, pe care o discutăm împreună a doua zi.

În ultima zi rezolvăm tema împreună, terminăm produsul final gândit de fiecare și facem styling pentru fiecare participant — iar la final, o ședință foto într-o locație potrivită, cu toți cei din atelier.`,
    bring: `O pereche de blugi albaștri (blue jeans), adusă de acasă în bagaj.`,
  },
  {
    slug: "atelier-dans-teo",
    trainer: "Teodora Velescu",
    discipline: "Dans",
    photo: "teo-velescu.jpg",
    photoCredit: "Cătălin Asanache",
    bio: `Teodora Velescu este coregrafă și dansatoare stabilită în București. S-a specializat în dans clasic la Liceul de Coregrafie „Floria Capsali” și a obținut licența în coregrafie și masteratul în pedagogia dansului la UNATC, unde este în prezent doctorandă în Teatru și Artele Spectacolului.

Colaborează cu instituții precum Teatrul Național București, Opera Națională București, Opera Comică pentru Copii și Centrul Național al Dansului, dar și cu companii independente (Tangaj Collective, Vanner Collective, Linotip). A performat în festivaluri naționale și internaționale și a curatoriat primele două ediții ale festivalului HazarDance, parte din Romanian Creative Week.

Dragostea pentru mișcare și curiozitatea de a descoperi misterele corpului o conduc în fiecare interacțiune cu dansul, iar legătura dintre teatru și dans — transferul de idei și instrumente dintre ele — îi motivează cercetarea și creația.`,
    workshopTitle: "Ție cum îți place să te miști?",
    workshopDescription: `Când te gândești la mișcare, care este prima imagine care-ți apare în minte? Te vezi pe tine, o formă abstractă, sau poate o salcie într-o zi ploioasă? Nu există răspunsuri greșite — dansul poate cuprinde atât de multe universuri, pentru că se naște din noi, oamenii. Iar noi, deși suntem diferiți, tot prin dans suntem aduși împreună.

Acest atelier este menit să ne aducă împreună — minte, trup, suflet, dar și om cu om — prin exerciții de auto-conștientizare, improvizație și creație colectivă.

Imaginație, inspirație, emoție, creație, vocație, meditație, vibrație — ție cum îți place să te miști?`,
    bring: `Haine de mișcare și șosete.`,
  },
  {
    slug: "atelier-film",
    trainer: "Tudor Platon",
    discipline: "Film",
    photo: "tudor-platon.jpg",
    photoCredit: "Franklin Yeep",
    bio: `Tudor Platon este regizor de documentare și director de imagine. Debutul său regizoral, „Casa cu păpuși”, a avut premiera în 2020 la Festivalul de Film de la Sarajevo și a fost selectat la Transilvania IFF, Zagreb Dox, Biografilm Festival și Astra Film Festival. Al doilea lungmetraj, „O familie aproape perfectă”, a avut premiera la Ji.hlava IDFF 2024, în competiția Opus Bonum.

Ca director de imagine a lucrat la peste douăzeci de filme de ficțiune și documentare, care au avut premiera și au fost premiate la festivaluri precum Cannes, Veneția și Locarno. Este membru al Academiei Europene de Film.`,
    workshopTitle: "Atelier de film",
    workshopDescription: `Atelierul urmărește deprinderea abilității de „citire” a imaginilor ca mijloc de cunoaștere, reflecție și expresie personală.

Vom lucra într-un cadru de învățare pe orizontală, unde participanții și trainerii descoperă împreună sensuri și perspective noi, cu atenția îndreptată mai mult către procesul în sine decât către un rezultat prestabilit.`,
  },
];
