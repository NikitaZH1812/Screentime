/**
 * A real film, picked from TMDB rather than typed. Carrying the id means the
 * anchor in the reason line refers to something that provably exists.
 * tmdb_id is nullable only to keep profiles written before the search existed.
 */
export type FilmRef = {
  tmdb_id: number | null;
  title: string;
  year: number | null;
  poster_path: string | null;
};

/**
 * Level 1 of the data model: permanent, hard, belongs to one individual.
 * Accumulates over time and never mixes with an evening's wish.
 */
export type Person = {
  id: string;
  name: string;
  /** Picked from the fixed genre list, so these map straight onto TMDB filters. */
  genre_exclusions: string[];
  /** Free-form, narrower than a genre: "замки і дракони", "магія". */
  type_exclusions: string[];
  /** What good looks like for this person. */
  good_examples: FilmRef[];
  /** What bad looks like. Just as informative, and easier to recall. */
  bad_examples: FilmRef[];
  subscriptions: string[];
  requires_ukrainian_audio: boolean;
};

/** id is empty until Supabase assigns a real one on insert — the empty string is the "new" sentinel. */
export function emptyPerson(): Person {
  return {
    id: "",
    name: "",
    genre_exclusions: [],
    type_exclusions: [],
    good_examples: [],
    bad_examples: [],
    subscriptions: [],
    requires_ukrainian_audio: false,
  };
}

/** How much time we have. Discrete buckets, never a free number. */
export type TimeBucket = "short" | "medium" | "any";

/** How much brain we have left. */
export type BrainLevel = "low" | "normal";

/** Old favourite or something new. Soft — a bias like the genre wish. */
export type Era = "old" | "any" | "new";

/**
 * Level 2 of the data model: the evening. Soft, session-only.
 * NEVER written back to a Person.
 */
export type Evening = {
  personIds: string[];
  time: TimeBucket;
  brain: BrainLevel;
  /** The evening wish. A bias, never an obligation. Dies with the session. */
  genreWish: string | null;
  era: Era;
};

export type Candidate = {
  tmdb_id: number;
  title: string;
  year: number | null;
  runtime: number | null;
  overview: string;
  genres: string[];
  poster_path: string | null;
  vote_average: number;
};

export type Pick = {
  tmdb_id: number;
  title: string;
  year: number | null;
  runtime: number | null;
  poster_path: string | null;
  reason: string;
};

export type RefusalReason = "already_seen" | "not_tonight";

/**
 * Level 3 of the data model: the combination. Belongs to an exact group of
 * people, not to any person in it — [a, b] has its own history, distinct
 * from a's alone, b's alone, or [a, b, c]. Learned ONLY from this: never
 * computed as an average or intersection of individual taste.
 */
export type CombinationFeedback = {
  tmdb_id: number;
  title: string;
  timestamp: string;
  watched: boolean;
  liked: boolean | null;
};

/**
 * What the recommendation pipeline actually receives for a given evening's
 * group. `history` is this exact group's own record. `subgroups` is the
 * unknown-combination fallback: what worked for known smaller groups inside
 * this one, handed to the model as-is — never averaged into a score by us.
 */
export type CombinationContext = {
  history: CombinationFeedback[];
  subgroups: { names: string[]; history: CombinationFeedback[] }[];
};
