import { GENRE_ID_BY_LABEL, GENRE_LABEL_BY_ID } from "./genres";
import type { Candidate, Era, FilmRef, TimeBucket } from "./types";

const BASE = "https://api.themoviedb.org/3";

const RUNTIME_CAP: Record<TimeBucket, number | null> = {
  short: 95,
  medium: 140,
  any: null,
};

/** The era wish is soft — a bias like the genre wish, dropped first if it starves the pool. */
function eraWindow(era: Era): { gte?: string; lte?: string } {
  const year = new Date().getFullYear();
  if (era === "old") return { lte: `${year - 15}-12-31` };
  if (era === "new") return { gte: `${year - 2}-01-01` };
  return {};
}

/**
 * Genre exclusions are picked from the fixed list, so they map straight onto
 * TMDB ids — no guessing. Type exclusions ("замки і дракони") are narrower
 * than any genre and can only be enforced by the model, further down.
 */
export function excludedGenreIds(genreExclusions: string[]): number[] {
  return [
    ...new Set(
      genreExclusions
        .map((label) => GENRE_ID_BY_LABEL[label])
        .filter((id): id is number => typeof id === "number"),
    ),
  ];
}

function authHeaders(key: string): HeadersInit {
  // TMDB accepts either a v4 bearer token or a v3 key as a query param.
  return key.startsWith("eyJ")
    ? { Authorization: `Bearer ${key}`, accept: "application/json" }
    : { accept: "application/json" };
}

function withKey(url: URL, key: string): URL {
  if (!key.startsWith("eyJ")) url.searchParams.set("api_key", key);
  return url;
}

async function tmdb(path: string, params: Record<string, string>) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");

  const url = withKey(new URL(BASE + path), key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: authHeaders(key) });
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

type DiscoverParams = {
  excludeGenres: number[];
  wishGenre: number | null;
  runtimeCap: number | null;
  era: Era;
  /** Hard, safety-critical — never omitted regardless of ladder step. */
  kidsInRoom: boolean;
  page: number;
};

async function discover(p: DiscoverParams): Promise<{ id: number }[]> {
  const params: Record<string, string> = {
    language: "uk-UA",
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": "200",
    page: String(p.page),
  };
  if (p.excludeGenres.length) {
    params.without_genres = p.excludeGenres.join(",");
  }
  if (p.wishGenre) params.with_genres = String(p.wishGenre);
  if (p.runtimeCap) params["with_runtime.lte"] = String(p.runtimeCap);

  const window = eraWindow(p.era);
  if (window.gte) params["primary_release_date.gte"] = window.gte;
  if (window.lte) params["primary_release_date.lte"] = window.lte;

  if (p.kidsInRoom) {
    // TMDB certification data is US-only and incomplete for older/foreign
    // titles — a soft best-effort, not a guarantee. Combined with the model
    // being told the same constraint as a hard rule it can read the plot for.
    params.certification_country = "US";
    params["certification.lte"] = "PG-13";
  }

  const json = await tmdb("/discover/movie", params);
  return json.results ?? [];
}

async function details(id: number): Promise<Candidate | null> {
  try {
    const m = await tmdb(`/movie/${id}`, { language: "uk-UA" });
    return {
      tmdb_id: m.id,
      title: m.title || m.original_title,
      year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
      runtime: m.runtime ?? null,
      overview: m.overview || "",
      genres: (m.genres ?? []).map((g: { id: number; name: string }) =>
        GENRE_LABEL_BY_ID[g.id] ?? g.name,
      ),
      poster_path: m.poster_path ?? null,
      vote_average: m.vote_average ?? 0,
    };
  } catch {
    return null;
  }
}

export type RetrievalResult = {
  candidates: Candidate[];
  /** Which soft constraints we had to drop to avoid an empty screen. */
  relaxed: string[];
};

/**
 * Stage 1 of the pipeline: hard constraints only, no taste judgement.
 *
 * If the constraints yield nothing we walk down a relaxation ladder rather
 * than return an empty set — an empty screen is never an acceptable answer.
 */
export async function retrieveCandidates(opts: {
  genreExclusions: string[];
  time: TimeBucket;
  genreWish: string | null;
  era: Era;
  kidsInRoom: boolean;
  excludeIds: number[];
}): Promise<RetrievalResult> {
  const excludeGenres = excludedGenreIds(opts.genreExclusions);
  const wish = opts.genreWish ? GENRE_ID_BY_LABEL[opts.genreWish] ?? null : null;
  const cap = RUNTIME_CAP[opts.time];
  const eraLabel = opts.era === "old" ? "старі" : opts.era === "new" ? "нові" : null;

  // kidsInRoom rides along on every rung below — it is a safety constraint,
  // never a taste preference, so it is never the thing that gets relaxed.
  const base = { excludeGenres, kidsInRoom: opts.kidsInRoom };

  const ladder: { params: Omit<DiscoverParams, "page">; relaxed: string[] }[] = [
    { params: { ...base, wishGenre: wish, runtimeCap: cap, era: opts.era }, relaxed: [] },
    {
      params: { ...base, wishGenre: null, runtimeCap: cap, era: opts.era },
      relaxed: opts.genreWish ? [`жанр «${opts.genreWish}»`] : [],
    },
    {
      params: { ...base, wishGenre: null, runtimeCap: cap, era: "any" },
      relaxed: [
        ...(opts.genreWish ? [`жанр «${opts.genreWish}»`] : []),
        ...(eraLabel ? [`тільки ${eraLabel}`] : []),
      ],
    },
    {
      params: { ...base, wishGenre: null, runtimeCap: cap ? cap + 45 : null, era: "any" },
      relaxed: [
        ...(opts.genreWish ? [`жанр «${opts.genreWish}»`] : []),
        ...(eraLabel ? [`тільки ${eraLabel}`] : []),
        ...(cap ? ["ліміт часу"] : []),
      ],
    },
    {
      params: { ...base, wishGenre: null, runtimeCap: null, era: "any" },
      relaxed: [
        ...(opts.genreWish ? [`жанр «${opts.genreWish}»`] : []),
        ...(eraLabel ? [`тільки ${eraLabel}`] : []),
        ...(cap ? ["ліміт часу"] : []),
      ],
    },
  ];

  for (const step of ladder) {
    const rows = [
      ...(await discover({ ...step.params, page: 1 })),
      ...(await discover({ ...step.params, page: 2 })),
    ];

    const ids = rows
      .map((r) => r.id)
      .filter((id) => !opts.excludeIds.includes(id))
      .slice(0, 30);

    const full = (await Promise.all(ids.map(details))).filter(
      (c): c is Candidate => c !== null,
    );

    if (full.length >= 8) return { candidates: full, relaxed: step.relaxed };
  }

  // Nothing survived even the loosest query — return whatever popular films
  // exist so the screen is never blank. kidsInRoom still applies: an empty
  // screen is unacceptable, an inappropriate pick in front of a kid is worse.
  const rows = await discover({
    excludeGenres: [],
    wishGenre: null,
    runtimeCap: null,
    era: "any",
    kidsInRoom: opts.kidsInRoom,
    page: 1,
  });
  const ids = rows
    .map((r) => r.id)
    .filter((id) => !opts.excludeIds.includes(id))
    .slice(0, 20);
  const full = (await Promise.all(ids.map(details))).filter(
    (c): c is Candidate => c !== null,
  );
  return { candidates: full, relaxed: ["усі фільтри"] };
}

export { posterUrl, watchUrl } from "./tmdbUrls";

/** Autocomplete for the profile form: real films, not typed strings. */
export async function searchFilms(query: string): Promise<FilmRef[]> {
  const json = await tmdb("/search/movie", {
    language: "uk-UA",
    include_adult: "false",
    query,
  });

  return (json.results ?? [])
    .slice(0, 8)
    .map((m: {
      id: number;
      title: string;
      original_title: string;
      release_date?: string;
      poster_path: string | null;
    }) => ({
      tmdb_id: m.id,
      title: m.title || m.original_title,
      year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
      poster_path: m.poster_path ?? null,
    }));
}
