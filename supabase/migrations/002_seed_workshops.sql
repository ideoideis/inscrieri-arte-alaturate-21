-- =============================================================================
-- Seed the workshops (capacity is the source of truth here; display text lives
-- in src/data/workshops.ts, keyed by the SAME slug).
--
-- IMPORTANT: keep the `slug` values identical to src/data/workshops.ts.
-- Re-running this is safe: it upserts titlu/capacity/sort but leaves `taken`
-- untouched so live counts survive a re-seed.
-- =============================================================================

-- Remove the old placeholder workshops from the example seed, if present
-- (safe: they have no enrollments).
delete from public.aa_workshops
where slug in ('atelier-actorie','atelier-scenografie','atelier-muzica',
               'atelier-dans','atelier-foto-video','atelier-scriere');

insert into public.aa_workshops (slug, titlu, capacity, sort) values
  ('atelier-scriere-dramatica', 'Atelier de scriere dramatică',          16, 1),
  ('atelier-dans-filip',        'Dance as Self Discovery',               20, 2),
  ('atelier-film',              'Atelier de film și imagini în mișcare', 14, 3),
  ('atelier-improvizatie',      'Improv 101',                            12, 4),
  ('atelier-dans-teo',          'Ție cum îți place să te miști?',         18, 5),
  ('atelier-costume',           'Atelierul de costum / modă',            14, 6)
on conflict (slug) do update
  set titlu = excluded.titlu,
      capacity = excluded.capacity,
      sort = excluded.sort;
