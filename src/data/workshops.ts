// =============================================================================
// Trainers & workshops — display content (hardcoded, as decided).
// =============================================================================
// The `slug` of each entry MUST match a row in the aa_workshops table
// (see supabase/migrations/002_seed_workshops.sql). Capacity & live spot counts
// come from the database; everything below is just what users see.
//
// Photos: drop the real files into  public/trainers/  and set `photo` to the
// filename (e.g. "ana-trainer.jpg"). The BASE_URL prefix for GitHub Pages is
// added automatically in the UI. Until then they fall back to placeholder.svg.
// =============================================================================

export type Workshop = {
  slug: string; // must match aa_workshops.slug
  trainer: string; // trainer full name
  photo: string; // filename inside public/trainers/  (or "" for placeholder)
  bio: string; // short trainer bio
  workshopTitle: string; // workshop name (mirror of aa_workshops.titlu)
  workshopDescription: string; // what the kids will do
};

export const WORKSHOPS: Workshop[] = [
  {
    slug: "atelier-actorie",
    trainer: "Nume Trainer Actorie",
    photo: "",
    bio: "Bio scurtă a trainerului — experiență, spectacole, ce îi place să exploreze cu adolescenții. (Înlocuiește acest text.)",
    workshopTitle: "Atelier de Actorie",
    workshopDescription:
      "Descriere atelier: jocuri de actorie, prezență scenică, lucru cu emoția și improvizație. Ce vor experimenta participanții pe parcursul atelierului. (Înlocuiește acest text.)",
  },
  {
    slug: "atelier-scenografie",
    trainer: "Nume Trainer Scenografie",
    photo: "",
    bio: "Bio scurtă a trainerului. (Înlocuiește acest text.)",
    workshopTitle: "Atelier de Scenografie",
    workshopDescription:
      "Descriere atelier: spațiul scenic, obiectul de scenă, lumină și culoare — cum se construiește lumea unui spectacol. (Înlocuiește acest text.)",
  },
  {
    slug: "atelier-muzica",
    trainer: "Nume Trainer Muzică",
    photo: "",
    bio: "Bio scurtă a trainerului. (Înlocuiește acest text.)",
    workshopTitle: "Atelier de Muzică & Coloană Sonoră",
    workshopDescription:
      "Descriere atelier: ritm, voce, sound design și cum sună emoția unui spectacol. (Înlocuiește acest text.)",
  },
  {
    slug: "atelier-dans",
    trainer: "Nume Trainer Dans",
    photo: "",
    bio: "Bio scurtă a trainerului. (Înlocuiește acest text.)",
    workshopTitle: "Atelier de Dans & Mișcare Scenică",
    workshopDescription:
      "Descriere atelier: corpul ca instrument, mișcare în spațiu, coregrafie de grup. (Înlocuiește acest text.)",
  },
  {
    slug: "atelier-foto-video",
    trainer: "Nume Trainer Foto-Video",
    photo: "",
    bio: "Bio scurtă a trainerului. (Înlocuiește acest text.)",
    workshopTitle: "Atelier de Foto-Video",
    workshopDescription:
      "Descriere atelier: cadru, lumină, montaj — povestea spusă prin imagine. (Înlocuiește acest text.)",
  },
  {
    slug: "atelier-scriere",
    trainer: "Nume Trainer Scriere",
    photo: "",
    bio: "Bio scurtă a trainerului. (Înlocuiește acest text.)",
    workshopTitle: "Atelier de Scriere Creativă",
    workshopDescription:
      "Descriere atelier: de la idee la text, personaj și dialog — scrisul ca joc. (Înlocuiește acest text.)",
  },
];
