import { createClient } from "./supabase/client";
import type { RefusalReason } from "./types";

/**
 * The refusal log is a V1 feature, not analytics we add later.
 *
 * The `unavailable` reason (nothing on their services / no Ukrainian audio)
 * was dropped from the UI by product decision — only `already_seen` and
 * `not_tonight` remain. That means this log no longer measures the
 * availability-failure rate CLAUDE.md originally wanted it for; it still
 * captures declared subscriptions and audio requirement per entry in case
 * that signal needs to come back.
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
