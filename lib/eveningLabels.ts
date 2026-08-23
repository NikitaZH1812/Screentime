import type { BrainLevel, Era, TimeBucket } from "./types";

/**
 * Client-safe display labels for the evening dials. Separate from the
 * prompt-facing labels in lib/claude.ts (server-only, imports the SDK) —
 * this file must stay importable from a client component.
 */
export function timeChipLabel(t: TimeBucket) {
  return { short: "до 1.5 год", medium: "~2 год", any: "час не обмежений" }[t];
}

export function brainChipLabel(b: BrainLevel) {
  return b === "low" ? "легкий вечір" : "можна складніше";
}

export function eraChipLabel(e: Era) {
  return { old: "старе перевірене", new: "щось нове", any: null }[e];
}
