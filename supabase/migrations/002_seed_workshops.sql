-- =============================================================================
-- Seed the workshops (capacity is the source of truth here; display text lives
-- in src/data/workshops.ts, keyed by the SAME slug).
--
-- IMPORTANT: keep the `slug` values identical to src/data/workshops.ts.
-- Re-running this is safe: it upserts titlu/capacity/sort but leaves `taken`
-- untouched so live counts survive a re-seed.
-- =============================================================================
insert into public.aa_workshops (slug, titlu, capacity, sort) values
  ('atelier-actorie',     'Atelier de Actorie',                 20, 1),
  ('atelier-scenografie', 'Atelier de Scenografie',             15, 2),
  ('atelier-muzica',      'Atelier de Muzică & Coloană Sonoră', 15, 3),
  ('atelier-dans',        'Atelier de Dans & Mișcare Scenică',  20, 4),
  ('atelier-foto-video',  'Atelier de Foto-Video',              12, 5),
  ('atelier-scriere',     'Atelier de Scriere Creativă',        18, 6)
on conflict (slug) do update
  set titlu = excluded.titlu,
      capacity = excluded.capacity,
      sort = excluded.sort;
