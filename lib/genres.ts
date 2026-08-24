export { genreLabel } from "./i18n";

/** Client-safe genre table. Labels are what people pick; ids are what TMDB filters on. */
export const GENRES: { label: string; id: number }[] = [
  { label: "бойовик", id: 28 },
  { label: "пригоди", id: 12 },
  { label: "анімація", id: 16 },
  { label: "комедія", id: 35 },
  { label: "кримінал", id: 80 },
  { label: "документальний", id: 99 },
  { label: "драма", id: 18 },
  { label: "сімейний", id: 10751 },
  { label: "фентезі", id: 14 },
  { label: "історичний", id: 36 },
  { label: "жахи", id: 27 },
  { label: "мюзикл", id: 10402 },
  { label: "детектив", id: 9648 },
  { label: "романтика", id: 10749 },
  { label: "фантастика", id: 878 },
  { label: "трилер", id: 53 },
  { label: "військовий", id: 10752 },
  { label: "вестерн", id: 37 },
];

export const GENRE_ID_BY_LABEL: Record<string, number> = Object.fromEntries(
  GENRES.map((g) => [g.label, g.id]),
);

export const GENRE_LABEL_BY_ID: Record<number, string> = Object.fromEntries(
  GENRES.map((g) => [g.id, g.label]),
);

/** The evening wish is a small subset — a bias for tonight, not a taxonomy. */
export const WISH_GENRES = [
  "комедія",
  "трилер",
  "драма",
  "фантастика",
  "жахи",
  "пригоди",
];

export const SERVICES = ["Netflix", "Megogo", "Sweet.tv", "Apple TV", "YouTube"];
