"use client";

import type { Person } from "./types";

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
    return raw ? (JSON.parse(raw) as Person[]) : [];
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
