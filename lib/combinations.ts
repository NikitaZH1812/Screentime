import { createClient } from "./supabase/client";
import type { CombinationFeedback } from "./types";

/**
 * Level 3 of the data model, in Supabase: combination_feedback. Belongs to
 * an exact group of people, not to any person in it — [a, b] has its own
 * row set, distinct from a alone, b alone, or [a, b, c]. Learned only from
 * this: never computed as an average or intersection of individual taste.
 *
 * person_ids is always sorted before it touches the database, so exact-group
 * queries can use plain array equality and subgroup queries can use `<@`
 * (contained-by) — no separate canonical-key column needed.
 */
function sortedIds(personIds: string[]): string[] {
  return [...new Set(personIds)].sort();
}

type Row = {
  tmdb_id: number;
  title: string;
  watched: boolean;
  liked: boolean | null;
  created_at: string;
};

function fromRow(r: Row): CombinationFeedback {
  return {
    tmdb_id: r.tmdb_id,
    title: r.title,
    watched: r.watched,
    liked: r.liked,
    timestamp: r.created_at,
  };
}

export async function recordFeedback(
  personIds: string[],
  entry: Omit<CombinationFeedback, "timestamp">,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("combination_feedback").insert({
    person_ids: sortedIds(personIds),
    tmdb_id: entry.tmdb_id,
    title: entry.title,
    watched: entry.watched,
    liked: entry.liked,
  });
  if (error) throw error;
}

/** This exact group's own history — the only thing that counts as "their" taste. */
export async function historyFor(personIds: string[]): Promise<CombinationFeedback[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("combination_feedback")
    .select("tmdb_id, title, watched, liked, created_at")
    .eq("person_ids", sortedIds(personIds));

  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

/**
 * Unknown-combination fallback: known smaller groups fully contained in this
 * one. Kept as separate per-subgroup records — never merged into one pooled
 * list, so nothing downstream can average them into a single score.
 */
export async function subgroupSignals(
  personIds: string[],
): Promise<{ personIds: string[]; history: CombinationFeedback[] }[]> {
  const supabase = createClient();
  const target = sortedIds(personIds);

  const { data, error } = await supabase
    .from("combination_feedback")
    .select("person_ids, tmdb_id, title, watched, liked, created_at")
    .filter("person_ids", "cd", `{${target.join(",")}}`);

  if (error) throw error;

  const grouped = new Map<string, { personIds: string[]; history: CombinationFeedback[] }>();
  for (const row of data as (Row & { person_ids: string[] })[]) {
    const key = row.person_ids.join(",");
    if (key === target.join(",")) continue; // exact match is handled separately
    if (!grouped.has(key)) grouped.set(key, { personIds: row.person_ids, history: [] });
    grouped.get(key)!.history.push(fromRow(row));
  }
  return [...grouped.values()];
}
