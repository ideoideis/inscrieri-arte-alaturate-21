-- =============================================================================
-- Înscrieri Ateliere de Arte Alăturate #21
-- =============================================================================
-- Shares the same Supabase project as info-trupe-21 / a-moment-of-trust.
-- All objects are namespaced with the "aa_" prefix so they never collide with
-- the existing trupe tables.
--
-- Design goals (the hard part of this page):
--   1. ~100 kids hitting "enroll" at the same time must NEVER oversell a
--      workshop's limited spots  -> handled by aa_enroll() with row locking.
--   2. Each kid can enroll exactly once                 -> UNIQUE(kid_id).
--   3. Live spot counts on every open browser w/o reload-> Realtime on
--      aa_workshops.taken (no personal data exposed).
-- =============================================================================

-- --- Groups the kids belong to (e.g. their troupe / city) --------------------
create table if not exists public.aa_groups (
  id    uuid primary key default gen_random_uuid(),
  nume  text not null unique,
  sort  int  not null default 0           -- optional display order
);

-- --- The pre-loaded roster: every kid that is allowed to enroll --------------
create table if not exists public.aa_kids (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.aa_groups(id) on delete cascade,
  nume      text not null,
  created_at timestamptz not null default now(),
  unique (group_id, nume)                  -- no duplicate name within a group
);
create index if not exists aa_kids_group_idx on public.aa_kids(group_id);

-- --- Workshops: capacity + live taken counter --------------------------------
-- Display content (trainer photo, bio, descriptions) is hardcoded in the app,
-- keyed by `slug`. Only capacity and the live counter live here.
create table if not exists public.aa_workshops (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  titlu     text not null,
  capacity  int  not null check (capacity >= 0),
  taken     int  not null default 0 check (taken >= 0),
  sort      int  not null default 0
);

-- --- Enrollments: one row per kid (the UNIQUE is the whole game) -------------
create table if not exists public.aa_enrollments (
  id          uuid primary key default gen_random_uuid(),
  kid_id      uuid not null unique references public.aa_kids(id) on delete cascade,
  workshop_id uuid not null references public.aa_workshops(id) on delete restrict,
  created_at  timestamptz not null default now()
);
create index if not exists aa_enrollments_workshop_idx on public.aa_enrollments(workshop_id);

-- --- Single-row config: when is the form open? ------------------------------
create table if not exists public.aa_config (
  id              int primary key default 1 check (id = 1),
  enrollment_open boolean not null default false,
  opens_at        timestamptz,             -- shown to users as "deschidem la ..."
  updated_at      timestamptz not null default now()
);
insert into public.aa_config (id, enrollment_open) values (1, false)
  on conflict (id) do nothing;

-- =============================================================================
-- aa_enroll() — the atomic enrollment transaction.
-- SECURITY DEFINER so it bypasses RLS and is the ONLY way rows land in
-- aa_enrollments. Returns a short status string the client switches on.
-- =============================================================================
create or replace function public.aa_enroll(p_kid uuid, p_workshop uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open  boolean;
  v_cap   int;
  v_taken int;
begin
  -- 1. Is enrollment open right now?
  select enrollment_open into v_open from aa_config where id = 1;
  if not coalesce(v_open, false) then
    return 'closed';
  end if;

  -- 2. Has this kid already enrolled? (fast path; UNIQUE is the real guard)
  if exists (select 1 from aa_enrollments where kid_id = p_kid) then
    return 'already';
  end if;

  -- 3. Lock the workshop row so concurrent enrollers serialize here. This is
  --    what makes "100 kids at once" safe: only one transaction holds the lock
  --    at a time, so the capacity check below can't be raced.
  select capacity, taken into v_cap, v_taken
  from aa_workshops
  where id = p_workshop
  for update;

  if not found then
    return 'notfound';
  end if;

  if v_taken >= v_cap then
    return 'full';
  end if;

  -- 4. Claim the spot.
  insert into aa_enrollments (kid_id, workshop_id) values (p_kid, p_workshop);
  update aa_workshops set taken = taken + 1 where id = p_workshop;

  return 'ok';
exception
  -- Belt-and-suspenders: if two requests for the same kid slip past step 2,
  -- the UNIQUE(kid_id) constraint rejects the second one here.
  when unique_violation then
    return 'already';
end;
$$;

-- Lets a kid (after picking their name) see if/where they're already enrolled,
-- without exposing the whole enrollments table to anon. Returns the workshop
-- slug, or null if not enrolled yet.
create or replace function public.aa_kid_enrollment(p_kid uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select w.slug
  from aa_enrollments e
  join aa_workshops w on w.id = e.workshop_id
  where e.kid_id = p_kid;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.aa_groups      enable row level security;
alter table public.aa_kids        enable row level security;
alter table public.aa_workshops   enable row level security;
alter table public.aa_enrollments enable row level security;
alter table public.aa_config      enable row level security;

-- Public reads: roster (so kids can find their name), workshops (capacity +
-- live counts), and config (the open/closed flag). None of these expose who
-- enrolled in what.
drop policy if exists "aa read groups" on public.aa_groups;
create policy "aa read groups" on public.aa_groups for select using (true);

drop policy if exists "aa read kids" on public.aa_kids;
create policy "aa read kids" on public.aa_kids for select using (true);

drop policy if exists "aa read workshops" on public.aa_workshops;
create policy "aa read workshops" on public.aa_workshops for select using (true);

drop policy if exists "aa read config" on public.aa_config;
create policy "aa read config" on public.aa_config for select using (true);

-- aa_enrollments has NO anon select/insert policy on purpose: rows only ever
-- get there through aa_enroll() (SECURITY DEFINER). The whole "who enrolled"
-- list stays private and the count can't be tampered with from the client.

-- Allow the public (anon) role to call the enrollment functions.
grant execute on function public.aa_enroll(uuid, uuid)       to anon, authenticated;
grant execute on function public.aa_kid_enrollment(uuid)     to anon, authenticated;

-- =============================================================================
-- Realtime: broadcast aa_workshops (live `taken`) and aa_config (open flag)
-- changes to every connected browser. Add tables to the supabase_realtime
-- publication.
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'aa_workshops'
  ) then
    alter publication supabase_realtime add table public.aa_workshops;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'aa_config'
  ) then
    alter publication supabase_realtime add table public.aa_config;
  end if;
end $$;
