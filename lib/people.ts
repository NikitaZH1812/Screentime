import type { Person } from "./types";

/**
 * Exclusions DO combine across people — the union of everyone's hard filters.
 * Preferences deliberately do not: a group's positive taste is its own thing,
 * never the average or the intersection of the individuals in it.
 */
export function unionGenreExclusions(people: Person[]): string[] {
  return [...new Set(people.flatMap((p) => p.genre_exclusions))];
}

export function unionTypeExclusions(people: Person[]): string[] {
  return [...new Set(people.flatMap((p) => p.type_exclusions))];
}

export function unionSubscriptions(people: Person[]): string[] {
  return [...new Set(people.flatMap((p) => p.subscriptions))];
}

/** If anyone in the room needs Ukrainian audio, the group does. */
export function needsUkrainianAudio(people: Person[]): boolean {
  return people.some((p) => p.requires_ukrainian_audio);
}
