-- ==============================================================
-- LANSAREA ÎNSCRIERILOR #21: rulează ASTA în Supabase SQL editor.
--
-- !!! Rulează O SINGURĂ DATĂ, ÎNAINTE de deschidere (înainte de
-- miercuri, 15 iulie 2026, 16:00). NU-l rula după ce s-au deschis
-- înscrierile: pasul 1 șterge TOATE înscrierile existente!
--
-- Face, în ordine:
--   1. curăță înscrierile de test (stress-testul din iulie);
--   2. aduce lineup-ul final + capacitățile (identic cu 002_seed_workshops.sql);
--   3. programează deschiderea: miercuri, 15 iulie 2026, 16:00 (ora României).
--      Pagina afișează singură countdown-ul și se activează automat la fix.
-- ==============================================================

-- 1) Curăță datele de test ----------------------------------------------------
delete from public.aa_enrollments;
update public.aa_workshops set taken = 0;

-- 2) Lineup-ul final #21 (Filip Stoica -> Eduard Chimac; Delia Riciu/improv ->
--    Theodor Ioniță/actorie de film) ------------------------------------------
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

-- 3) Programează deschiderea: miercuri, 15 iulie 2026, 16:00 (EEST) ------------
update public.aa_config
   set opens_at        = '2026-07-15 16:00:00+03',
       enrollment_open = false,
       force_closed    = false,
       updated_at      = now()
 where id = 1;

-- Verificare rapidă (opțional): rulează separat după script
--   select slug, titlu, capacity, taken from aa_workshops order by sort;
--   select * from aa_config;
