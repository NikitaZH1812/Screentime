import { createClient } from "./supabase/client";
import type { RefusalReason } from "./types";

/**
 * The refusal log is a V1 feature, not analytics we add later.
 *
 * Availability is user-declared in V1 — no API tells us whether a film is
 * really on their services with Ukrainian audio. Every `unavailable` refusal
 * is therefore the only evidence we will have when we decide, in a month,
 * whether the availability API is unnecessary or is the whole product.
 *
 * Written straight from the browser client, RLS-scoped to the owner — same
 * pattern as profiles and combination feedback, no API route needed.
 */
export async function logRefusal(entry: {
  personNames: string[];
  tmdb_id: number;
  title: string;
  reason: RefusalReason;
  declaredSubscriptions: string[];
  requiresUkrainianAudio: boolean;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("refusal_log").insert({
    person_names: entry.personNames,
    tmdb_id: entry.tmdb_id,
    title: entry.title,
    reason: entry.reason,
    declared_subscriptions: entry.declaredSubscriptions,
    requires_ukrainian_audio: entry.requiresUkrainianAudio,
  });
  if (error) console.error("[refusal log] failed to write:", error);
}
