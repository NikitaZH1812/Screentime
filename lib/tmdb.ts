import type { Candidate, TimeBucket } from "./types";

const BASE = "https://api.themoviedb.org/3";

/** TMDB genre ids we care about. */
const GENRE_IDS: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

const GENRE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(GENRE_IDS).map(([name, id]) => [id, name]),
);

/**
 * Permanent exclusions are free-form strings ("medieval fantasy"). TMDB can
 * only filter by genre id, so we map what we recognise and hand the rest to
 * the model as a hard rule. Deliberately generous: over-excluding is safer
 * than showing someone a film they have already said no to forever.
 */
const EXCLUSION_KEYWORDS: [RegExp, number][] = [
  [/musical/i, GENRE_IDS.music],
  [/fantasy|medieval/i, GENRE_IDS.fantasy],
  [/horror|gore|slasher/i, GENRE_IDS.horror],
  [/\bwar\b|military/i, GENRE_IDS.war],
  [/romance|romantic|rom.?com/i, GENRE_IDS.romance],
  [/animation|anime|cartoon/i, GENRE_IDS.animation],
  [/documentar/i, GENRE_IDS.documentary],
  [/western/i, GENRE_IDS.western],
  [/thriller/i, GENRE_IDS.thriller],
  [/crime/i, GENRE_IDS.crime],
];

/** The evening wish maps onto a genre bias, never a hard filter. */
const WISH_GENRES: Record<string, number> = {
  "комедія": GENRE_IDS.comedy,
  "трилер": GENRE_IDS.thriller,
  "драма": GENRE_IDS.drama,
  "фантастика": GENRE_IDS.scifi,
  "жахи": GENRE_IDS.horror,
  "пригоди": GENRE_IDS.adventure,
};

const RUNTIME_CAP: Record<TimeBucket, number | null> = {
  short: 95,
  medium: 140,
  any: null,
};

export function excludedGenreIds(exclusions: string[]): number[] {
  const ids = new Set<number>();
  for (const raw of exclusions) {
    for (const [pattern, id] of EXCLUSION_KEYWORDS) {
      if (pattern.test(raw)) ids.add(id);
    }
  }
  return [...ids];
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
        GENRE_NAMES[g.id] ?? g.name,
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
  exclusions: string[];
  time: TimeBucket;
  genreWish: string | null;
  excludeIds: number[];
}): Promise<RetrievalResult> {
  const excludeGenres = excludedGenreIds(opts.exclusions);
  const wish = opts.genreWish ? WISH_GENRES[opts.genreWish] ?? null : null;
  const cap = RUNTIME_CAP[opts.time];

  const ladder: { params: Omit<DiscoverParams, "page">; relaxed: string[] }[] = [
    { params: { excludeGenres, wishGenre: wish, runtimeCap: cap }, relaxed: [] },
    {
      params: { excludeGenres, wishGenre: null, runtimeCap: cap },
      relaxed: opts.genreWish ? [`жанр «${opts.genreWish}»`] : [],
    },
    {
      params: { excludeGenres, wishGenre: null, runtimeCap: cap ? cap + 45 : null },
      relaxed: [
        ...(opts.genreWish ? [`жанр «${opts.genreWish}»`] : []),
        ...(cap ? ["ліміт часу"] : []),
      ],
    },
    {
      params: { excludeGenres, wishGenre: null, runtimeCap: null },
      relaxed: [
        ...(opts.genreWish ? [`жанр «${opts.genreWish}»`] : []),
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
  // exist so the screen is never blank.
  const rows = await discover({
    excludeGenres: [],
    wishGenre: null,
    runtimeCap: null,
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
