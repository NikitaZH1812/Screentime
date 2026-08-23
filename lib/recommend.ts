import type { Brain, Film } from "./types";

// Placeholder catalog until TMDB + the model pick this from real candidates.
export const CATALOG: Film[] = [
  { id: "1", title: "Прибуття", year: 2016, runtimeMinutes: 116, weight: "heavy", service: "Netflix", genre: "фантастика" },
  { id: "2", title: "Знедолені", year: 2019, runtimeMinutes: 137, weight: "heavy", service: "Sweet.tv", genre: "драма" },
  { id: "3", title: "Круелла", year: 2021, runtimeMinutes: 134, weight: "light", service: "Megogo", genre: "комедія" },
  { id: "4", title: "В'язні", year: 2013, runtimeMinutes: 153, weight: "heavy", service: "Netflix", genre: "трилер" },
  { id: "5", title: "Паддінгтон 2", year: 2017, runtimeMinutes: 103, weight: "light", service: "Megogo", genre: "сімейний" },
  { id: "6", title: "Одного разу в Голлівуді", year: 2019, runtimeMinutes: 161, weight: "heavy", service: "Netflix", genre: "драма" },
  { id: "7", title: "Ла-Ла Ленд", year: 2016, runtimeMinutes: 128, weight: "light", service: "Sweet.tv", genre: "мюзикл" },
  { id: "8", title: "Гарячі новини", year: 2019, runtimeMinutes: 109, weight: "light", service: "Megogo", genre: "комедія" },
  { id: "9", title: "Дюна", year: 2021, runtimeMinutes: 155, weight: "heavy", service: "Netflix", genre: "фантастика" },
  { id: "10", title: "Малий з Ліверпуля", year: 2021, runtimeMinutes: 101, weight: "light", service: "Sweet.tv", genre: "комедія" },
];

export type RecommendInput = {
  people: string[];
  maxMinutes: number;
  brain: Brain;
};

export type Recommendation = {
  film: Film;
  reason: string;
  relaxed: boolean;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}хв`;
  if (rest === 0) return `${hours}год`;
  return `${hours}год ${rest}хв`;
}

export function pickFilm({ people, maxMinutes, brain }: RecommendInput): Recommendation {
  const fitsTime = CATALOG.filter((f) => f.runtimeMinutes <= maxMinutes);
  const relaxed = fitsTime.length === 0;
  const pool = relaxed ? CATALOG : fitsTime;

  const [film] = [...pool].sort((a, b) => {
    const scoreA = a.weight === brain ? 0 : 1;
    const scoreB = b.weight === brain ? 0 : 1;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return Math.abs(a.runtimeMinutes - maxMinutes) - Math.abs(b.runtimeMinutes - maxMinutes);
  });

  const base = `${people.join(" і ")} · ${film.service} · ${formatDuration(film.runtimeMinutes)}`;
  const reason = relaxed
    ? `Нічого рівно під ваш час не знайшли — ось найближче: ${base}`
    : base;

  return { film, reason, relaxed };
}
