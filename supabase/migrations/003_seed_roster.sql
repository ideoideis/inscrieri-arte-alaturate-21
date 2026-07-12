-- =============================================================================
-- Roster: real participants (coordinators intentionally EXCLUDED).
-- =============================================================================
-- The pre-loaded roster is what guarantees "each kid enrolls only once": the
-- kid picks their group, then their name from this list, and the enrollment is
-- tied to that kid row (UNIQUE). Free-typed names are NOT accepted.
--
-- Safe to re-run (on conflict do nothing). Removes the old example rows first.
-- =============================================================================

-- Drop the placeholder groups from 003_seed_roster_example.sql, if they exist.
delete from public.aa_groups where nume like '%exemplu%';

-- --- Groups (festival troupes) ----------------------------------------------
insert into public.aa_groups (nume, sort) values
  ('Brainstorming - București',          1),
  ('Artwork - Iași',                     2),
  ('Atelierul de Teatru - Botoșani',     3),
  ('A.C.T - Bacău',                      4),
  ('Amprente - Brașov',                  5),
  ('Trupa Leira - Râmnicu Vâlcea',       6),
  ('Protha - Panciu',                    7)
on conflict (nume) do nothing;

-- Trupa din Alexandria a fost scoasă din ediția #21 (nu participă).
delete from public.aa_groups where nume = 'Trupa din Alexandria';

-- --- Helper: insert a kid into a group by group name -------------------------
-- Each block cross-joins the group row with a VALUES list of names.

-- Brainstorming - București (14)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Oprea Eduard'),('Dobrin Ionuț'),('Marcan Julia'),('Beciu Daria'),
  ('Ursu Mihaela'),('Papuc Petru'),('Mirea Ana'),('Duță Teodora'),
  ('Ene Mara'),('Cibotariu Miruna'),('Bogdan Diana'),('Sebastian Ioana'),
  ('Lazăr Ecaterina'),('Rusu Karina')
) as k(nume)
where g.nume = 'Brainstorming - București'
on conflict (group_id, nume) do nothing;

-- Artwork - Iași (14)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Blașcu Ștefania'),('Nicolau Amalia'),('Nedelcu Ana'),('Tufă Amalia'),
  ('Lucescu Lia'),('Oancea Darius'),('Militaru Maria'),('Lucescu Nectaria'),
  ('Isari Ivona'),('Huzum Melania'),('Brebu Andrei'),('Tun Zamfira'),
  ('Oglinzeanu Maria'),('Vlad Simon')
) as k(nume)
where g.nume = 'Artwork - Iași'
on conflict (group_id, nume) do nothing;

-- Atelierul de Teatru - Botoșani (15)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Aniței Evelin-Ștefania'),('Bursuc Ștefan'),('Franț-Rusu Denisa-Ioana'),
  ('Grădinaru Maria-Ecaterina'),('Ignat Maia-Ioana'),('Iordăchescu Alessia'),
  ('Jâșcanu Anastasia'),('Livadariu David'),('Sandu Maria-Timeea'),
  ('Scîntei Teofan'),('Teodoru Ana'),('Țîcu Ecaterina'),
  ('Ungureanu Alessia-Maria'),('Voroneanu Ana-Miruna'),('Niculina Alessia')
) as k(nume)
where g.nume = 'Atelierul de Teatru - Botoșani'
on conflict (group_id, nume) do nothing;

-- A.C.T - Bacău (13)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Avarvarei Cezara'),('Ilieș Theodora'),('Iojă Andreea'),
  ('Gherasimoaia Giulia'),('Niță Teodora'),('Turcu Andreea'),
  ('Cernat Teodora'),('Cupaș Raluca'),('Geangu Elena'),
  ('Doboșeriu David'),('Hazu Alexandru'),('Mihăilă Georgiana'),
  ('Păunescu Medeea')
) as k(nume)
where g.nume = 'A.C.T - Bacău'
on conflict (group_id, nume) do nothing;

-- Amprente - Brașov (11)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Oloeriu Maria'),('Coman Sofia'),('Bucur Rareș'),('Amocăniței Ștefan'),
  ('Corboș Bogdan'),('Bucur Teodor'),('Simionescu Luca'),('Hîrjoabă Diana'),
  ('Anganu Raluca'),('Băcanu Teodor-Sasha'),('Corboș Maria')
) as k(nume)
where g.nume = 'Amprente - Brașov'
on conflict (group_id, nume) do nothing;

-- Trupa Leira - Râmnicu Vâlcea (14)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Ignat Eduard'),('Marin Rebeca'),('Todeci Marta'),('Ruiu Călin'),
  ('Nicolae Anastasia'),('Constantin Ștefania'),('Palea Alexandra'),
  ('Ghițulescu Daria'),('Lupu Alexia'),('Diță Andrei'),('Purcărea Răzvan'),
  ('Stamatie Rareș'),('Popescu Alexandra'),('Mititelu Gabriela')
) as k(nume)
where g.nume = 'Trupa Leira - Râmnicu Vâlcea'
on conflict (group_id, nume) do nothing;

-- Protha - Panciu (14)
insert into public.aa_kids (group_id, nume)
select g.id, k.nume from public.aa_groups g cross join (values
  ('Zbîrciog Alina'),('Găman Andreea Patricia'),('Matei Georgiana Dănuța'),
  ('Pleșcan Melania Valentina'),('Melinte Miruna Cosmina'),('Costandache Cristina'),
  ('Manovici Teodor Andrei'),('Ignat David Raul'),('Popoiu Gabriel'),
  ('Vasile Alexandru'),('Roșu Bogdan Ionuț'),('Crucianu Teodor Ionuț'),
  ('Drăgan Denisa Maria'),('Drăgan Andreea')
) as k(nume)
where g.nume = 'Protha - Panciu'
on conflict (group_id, nume) do nothing;
