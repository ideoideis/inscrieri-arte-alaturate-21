# Supabase — Înscrieri Ateliere de Arte Alăturate #21

Uses the **same** Supabase project as `info-trupe-21` / `a-moment-of-trust`.
Everything is namespaced with the `aa_` prefix so it never touches the trupe
tables.

## Apply migrations

Open the Supabase SQL Editor for the project and run, in order:

1. `migrations/001_arte_alaturate.sql` — tables, the atomic `aa_enroll()`
   function, RLS policies, and Realtime publication.
2. `migrations/002_seed_workshops.sql` — workshop titles + **capacities**
   (keep the `slug`s in sync with `src/data/workshops.ts`).
3. `migrations/003_seed_roster_example.sql` — **EXAMPLE** roster. Replace with
   the real kids (edit the file, or import a CSV into `aa_groups` then
   `aa_kids` in the Table editor).

## How the guarantees work

- **No overselling under load:** `aa_enroll(kid, workshop)` does
  `SELECT ... FOR UPDATE` on the workshop row, so concurrent enrollers to the
  same workshop serialize — the capacity check can't be raced. 100 kids at once
  is trivial for Postgres.
- **One enrollment per kid:** `aa_enrollments.kid_id` is `UNIQUE`. Even if two
  requests slip through, the second hits the constraint and returns `already`.
- **Live counts, no reload:** `aa_workshops` (with its `taken` counter) and
  `aa_config` are in the `supabase_realtime` publication; the app subscribes and
  updates every open browser instantly. Only aggregate counts are exposed —
  `aa_enrollments` has no public read policy, so nobody can see who enrolled.

## Opening / closing enrollment

The form is gated by `aa_config`. To open it at the announced time, run in the
SQL editor (or flip the boolean in the Table editor):

```sql
-- announce a time (shown on the page); keep it closed for now
update aa_config set enrollment_open = false,
                     opens_at = '2026-06-27 18:00:00+03', updated_at = now()
where id = 1;

-- OPEN the form (takes effect live on every open page)
update aa_config set enrollment_open = true, updated_at = now() where id = 1;

-- CLOSE again
update aa_config set enrollment_open = false, updated_at = now() where id = 1;
```

## Resetting between dry-runs

```sql
delete from aa_enrollments;
update aa_workshops set taken = 0;
```

## Environment variables

See `.env.example`. The browser uses the **publishable (anon)** key; all data is
protected by Row Level Security and the `SECURITY DEFINER` functions.
