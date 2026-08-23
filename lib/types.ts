export type ReferenceFilm = {
  tmdb_id: number;
  title: string;
};

/** Level 1 of the data model: permanent, hard, belongs to one individual. */
export type Person = {
  id: string;
  name: string;
  reference_films: ReferenceFilm[];
  permanent_exclusions: string[];
  requires_ukrainian_audio: boolean;
  subscriptions: string[];
};

/** How much time we have. Discrete buckets, never a free number. */
export type TimeBucket = "short" | "medium" | "any";

/** How much brain we have left. */
export type BrainLevel = "low" | "normal";

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

export type RefusalReason = "already_seen" | "unavailable" | "not_tonight";

export type RefusalLogEntry = {
  timestamp: string;
  group: string[];
  tmdb_id: number;
  title: string;
  reason: RefusalReason;
  declared_subscriptions: string[];
  requires_ukrainian_audio: boolean;
};

export type FeedbackLogEntry = {
  timestamp: string;
  group: string[];
  tmdb_id: number;
  title: string;
  watched: boolean;
  liked: boolean | null;
};
