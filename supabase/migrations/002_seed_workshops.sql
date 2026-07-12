-- =============================================================================
-- Seed the workshops (capacity is the source of truth here; display text lives
-- in src/data/workshops.ts, keyed by the SAME slug).
--
-- IMPORTANT: keep the `slug` values identical to src/data/workshops.ts.
-- Re-running this is safe: it upserts titlu/capacity/sort but leaves `taken`
-- untouched so live counts survive a re-seed.
--
-- July 2026 lineup change: Filip Stoica (atelier-dans-filip) -> Eduard Chimac
-- (atelier-dans-eduard); Delia Riciu / Improv 101 (atelier-improvizatie) ->
-- Theodor Ioniță / actorie de film (atelier-actorie-film).
-- =============================================================================

-- Remove workshops that are no longer in the lineup (old example placeholders
-- + the two #21 replacements). The delete only touches rows WITHOUT
-- enrollments (workshop_id is ON DELETE RESTRICT anyway). If a row survives
-- because of stress-test enrollments, clear those first:
--   delete from aa_enrollments;  update aa_workshops set taken = 0;
-- ...then re-run this file.
delete from public.aa_workshops w
where w.slug in ('atelier-actorie','atelier-scenografie','atelier-muzica',
                 'atelier-dans','atelier-foto-video','atelier-scriere',
                 'atelier-dans-filip','atelier-improvizatie')
  and not exists (select 1 from public.aa_enrollments e where e.workshop_id = w.id);

insert into public.aa_workshops (slug, titlu, capacity, sort) values
  ('atelier-scriere-dramatica', 'Atelier de scriere dramatică',                                       13, 1),
  ('atelier-dans-eduard',       'WHAT IF?',                                                           20, 2),
  ('atelier-actorie-film',      'Atelier de actorie de film pentru adolescenți: Meisner & Weston',   15, 3),
  ('atelier-costume',           'Blugii de toate zilele sunt salvatorii nevăzuți',                    14, 4),
  ('atelier-dans-teo',          'Ție cum îți place să te miști?',                                      18, 5),
  ('atelier-film',              'Atelier de film',                                                    14, 6)
on conflict (slug) do update
  set titlu = excluded.titlu,
      capacity = excluded.capacity,
      sort = excluded.sort;
