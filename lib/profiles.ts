"use client";

import type { FilmRef, Person } from "./types";

/**
 * Examples used to be typed strings before they became TMDB picks. Convert
 * rather than drop: a profile someone filled in by hand is not disposable.
 */
function asFilmRefs(raw: unknown): FilmRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) =>
    typeof item === "string"
      ? { tmdb_id: null, title: item, year: null, poster_path: null }
      : (item as FilmRef),
  );
}

/**
 * Saved profiles live in the browser. No database in this build, and a person's
 * permanent taste is exactly the thing that must outlive a single evening —
 * so sessionStorage would be wrong here.
 */
const KEY = "screentime.profiles";

export function loadProfiles(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Person[]).map((p) => ({
      ...p,
      good_examples: asFilmRefs(p.good_examples),
      bad_examples: asFilmRefs(p.bad_examples),
    }));
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Person[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    // A full or blocked store must never break the evening.
  }
}
