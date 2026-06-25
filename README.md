# Înscrieri Ateliere de Arte Alăturate — Festivalul ideo ideis #21

Pagină de prezentare a trainerilor și atelierelor de **arte alăturate** și de
**înscriere** a participanților. Copiii răsfoiesc atelierele (poză trainer,
nume, bio, descriere atelier) și, când se deschid înscrierile, își rezervă un
loc — direct din pagină.

Construit cu Vite + React + TypeScript + Tailwind + shadcn/ui, cu Supabase
pentru date, în aceeași marcă vizuală ca `info-trupe-21`.

## Provocarea (și cum e rezolvată)

GitHub Pages e **static** — nu poate număra locuri sau garanta unicitatea. Toată
logica „grea” stă în Supabase:

- **~100 de copii deodată, fără să se depășească locurile** — funcția
  `aa_enroll()` blochează rândul atelierului (`SELECT ... FOR UPDATE`), deci
  înscrierile concurente la același atelier se serializează. Imposibil de „furat”
  un loc inexistent.
- **Fiecare copil se înscrie o singură dată** — constrângere `UNIQUE` pe
  `aa_enrollments.kid_id`, garantată de Postgres.
- **Locuri actualizate în timp real, fără reîncărcare** — Supabase Realtime
  trimite modificările de `taken`/`enrollment_open` în fiecare browser deschis.

Identitatea copilului: **roster pre-încărcat** — copilul alege grupa, apoi
numele din listă (fără text liber, deci fără greșeli sau duplicate).

## Dezvoltare locală

```bash
npm install
npm run dev      # http://localhost:8080
```

Variabilele Supabase sunt în `.env` (vezi `.env.example`). Cheia din browser e
cea **publishable** (anon); datele sunt protejate prin Row Level Security.

## Conținut (traineri & ateliere)

Textul și pozele sunt **hardcodate** în [`src/data/workshops.ts`](src/data/workshops.ts)
(cheia `slug` trebuie să corespundă cu rândurile din `aa_workshops`). Pozele se
pun în `public/trainers/` și se referă prin numele fișierului. Capacitatea fiecărui
atelier se setează în baza de date (vezi mai jos).

## Bază de date (Supabase)

Vezi [`supabase/README.md`](supabase/README.md): migrațiile, cum se deschid/închid
înscrierile (`aa_config`) și cum se resetează între teste.

## Build & Deploy — GitHub Pages

```bash
npm run build    # output în dist/
npm run preview  # servește build-ul local
```

Deploy automat prin GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
la fiecare push pe `main`. În producție `base` este
`/inscrieri-ateliere-arte-alaturate-21/` (vezi `vite.config.ts`). Site live:

**https://ideoideis.github.io/inscrieri-ateliere-arte-alaturate-21/**
