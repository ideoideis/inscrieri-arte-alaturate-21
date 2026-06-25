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
3. `migrations/003_seed_roster.sql` — the real roster (coordinators excluded).
   7 troupes with names (~95 kids) + Trupa din Alexandria (names TBD — add a
   block when available). Re-runnable; also removes the old example rows.

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

`aa_config` controls the gate. Effective open =
`(NOT force_closed) AND (enrollment_open OR now() >= opens_at)` — enforced both
on the page and inside `aa_enroll()`, so the schedule can't be bypassed.

**Normal flow — just schedule the time and walk away.** It auto-opens at that
instant on every browser (with a live countdown), no manual flip needed. Note the
timezone: Romania is `+03` in summer (EEST).

```sql
update aa_config set opens_at = '2026-07-03 19:00:00+03',
                     enrollment_open = false, force_closed = false, updated_at = now()
where id = 1;
```

Manual controls (optional):

```sql
-- force OPEN right now, ignoring the schedule
update aa_config set enrollment_open = true, force_closed = false, updated_at = now() where id = 1;

-- emergency STOP (overrides everything)
update aa_config set force_closed = true, updated_at = now() where id = 1;

-- back to closed / scheduled
update aa_config set enrollment_open = false, force_closed = false, updated_at = now() where id = 1;
```

## Resetting between dry-runs

```sql
delete from aa_enrollments;
update aa_workshops set taken = 0;
```

## Environment variables

See `.env.example`. The browser uses the **publishable (anon)** key; all data is
protected by Row Level Security and the `SECURITY DEFINER` functions.
