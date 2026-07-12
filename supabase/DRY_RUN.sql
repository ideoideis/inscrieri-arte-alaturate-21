-- ==============================================================
-- DRY RUN — testul cap-coadă de dinainte de lansare.
-- Rulează ASTA în Supabase SQL editor, apoi urmează pașii din
-- README (secțiunea "Dry run"). La final rulează RUN_FOR_LAUNCH.sql
-- ca să cureți testul și să programezi deschiderea reală.
--
-- Ce face:
--   1. curăță orice înscriere existentă (test vechi);
--   2. aduce lineup-ul final #21 + capacitățile (identic cu lansarea);
--   3. programează deschiderea peste 5 minute de la rulare —
--      pagina va afișa countdown-ul și se va activa singură.
-- ==============================================================

-- 1) Curăță ------------------------------------------------------------------
delete from public.aa_enrollments;
update public.aa_workshops set taken = 0;

-- 2) Lineup-ul final #21 -----------------------------------------------------
delete from public.aa_workshops w
where w.slug in ('atelier-actorie','atelier-scenografie','atelier-muzica',
                 'atelier-dans','atelier-foto-video','atelier-scriere',
                 'atelier-dans-filip','atelier-improvizatie')
  and not exists (select 1 from public.aa_enrollments e where e.workshop_id = w.id);

insert into public.aa_workshops (slug, titlu, capacity, sort) values
  ('atelier-scriere-dramatica', 'Atelier de scriere dramatică',                                       13, 1),
  ('atelier-dans-eduard',       'WHAT IF?',                                                           20, 2),
  ('atelier-actorie-film',      'Atelier de actorie de film pentru adolescenți — Meisner & Weston',   15, 3),
  ('atelier-costume',           'Blugii de toate zilele sunt salvatorii nevăzuți',                    14, 4),
  ('atelier-dans-teo',          'Ție cum îți place să te miști?',                                      18, 5),
  ('atelier-film',              'Atelier de film',                                                    14, 6)
on conflict (slug) do update
  set titlu = excluded.titlu,
      capacity = excluded.capacity,
      sort = excluded.sort;

-- 3) Deschide peste 5 minute --------------------------------------------------
update public.aa_config
   set opens_at        = now() + interval '5 minutes',
       enrollment_open = false,
       force_closed    = false,
       updated_at      = now()
 where id = 1;

-- Verificare (opțional, rulează separat):
--   select slug, titlu, capacity, taken from aa_workshops order by sort;
--   select now(), opens_at, enrollment_open, force_closed from aa_config;
