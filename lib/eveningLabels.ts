import { DICT, type Lang } from "./i18n";
import type { BrainLevel, Era, TimeBucket } from "./types";

/**
 * Client-safe display labels for the evening dials. Separate from the
 * prompt-facing labels in lib/claude.ts (server-only, imports the SDK) —
 * this file must stay importable from a client component.
 */
export function timeChipLabel(t: TimeBucket, lang: Lang) {
  return DICT[lang].tags.time(t);
}

export function brainChipLabel(b: BrainLevel, lang: Lang) {
  return DICT[lang].tags.brain(b);
}

export function eraChipLabel(e: Era, lang: Lang) {
  return DICT[lang].tags.era(e);
}
