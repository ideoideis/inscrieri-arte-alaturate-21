-- =============================================================================
-- EXAMPLE roster — REPLACE with the real kids before the event.
-- =============================================================================
-- The pre-loaded roster is what guarantees "each kid enrolls only once": the
-- kid picks their group, then their name from this list, and the enrollment is
-- tied to that kid row (UNIQUE). Free-typed names are NOT accepted.
--
-- Two ways to load the real data:
--   A) Edit the VALUES below and run this file in the SQL editor.
--   B) Import a CSV in the Supabase Table editor (aa_groups, then aa_kids).
--
-- This example is safe to re-run (on conflict do nothing).
-- =============================================================================

insert into public.aa_groups (nume, sort) values
  ('Grupa A — exemplu', 1),
  ('Grupa B — exemplu', 2)
on conflict (nume) do nothing;

-- Kids for "Grupa A — exemplu"
insert into public.aa_kids (group_id, nume)
select g.id, k.nume
from public.aa_groups g
cross join (values
  ('Ana Popescu'),
  ('Mihai Ionescu'),
  ('Ioana Radu')
) as k(nume)
where g.nume = 'Grupa A — exemplu'
on conflict (group_id, nume) do nothing;

-- Kids for "Grupa B — exemplu"
insert into public.aa_kids (group_id, nume)
select g.id, k.nume
from public.aa_groups g
cross join (values
  ('Andrei Georgescu'),
  ('Maria Dumitru'),
  ('Vlad Stan')
) as k(nume)
where g.nume = 'Grupa B — exemplu'
on conflict (group_id, nume) do nothing;
