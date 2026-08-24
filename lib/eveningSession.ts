"use client";

import type { BrainLevel, Era, Pick, TimeBucket } from "./types";

/**
 * Evening state, persisted — but in sessionStorage, not localStorage.
 * Belongs to one session per CLAUDE.md: it dies when the tab closes, not
 * when the page merely reloads. A refresh mid-pick was previously
 * indistinguishable from ending the evening, which it isn't.
 *
 * "profile" is deliberately never persisted here — editing a person isn't
 * Evening-level data, and restoring that stage without its editingId would
 * silently turn an edit into a duplicate-creating form.
 */
const KEY = "screentime.evening";

export type PersistableStage = "who" | "dials" | "pick" | "feedback";

export type EveningSession = {
  stage: PersistableStage;
  personIds: string[];
  time: TimeBucket;
  brain: BrainLevel;
  genreWish: string | null;
  era: Era;
  pick: Pick | null;
  seenIds: number[];
  refusedTitles: string[];
  notTonightCount: number;
};

export function loadEveningSession(): EveningSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EveningSession) : null;
  } catch {
    return null;
  }
}

export function saveEveningSession(session: EveningSession) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // A full or blocked store must never break the evening.
  }
}

export function clearEveningSession() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
