import seed from "@/data/people.json";
import type { Person } from "./types";

export const PEOPLE: Person[] = seed as Person[];

export function getPeople(ids: string[]): Person[] {
  return PEOPLE.filter((p) => ids.includes(p.id));
}

/**
 * Exclusions DO combine across people — the union of everyone's hard filters.
 * Preferences deliberately do not; a group's positive taste is its own thing.
 */
export function unionExclusions(people: Person[]): string[] {
  return [...new Set(people.flatMap((p) => p.permanent_exclusions))];
}

export function unionSubscriptions(people: Person[]): string[] {
  return [...new Set(people.flatMap((p) => p.subscriptions))];
}

/** If anyone in the room needs Ukrainian audio, the group does. */
export function needsUkrainianAudio(people: Person[]): boolean {
  return people.some((p) => p.requires_ukrainian_audio);
}
