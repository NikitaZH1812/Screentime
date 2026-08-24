import { createClient } from "./supabase/client";

/**
 * The second "не сьогодні" in one evening locks the exact group out for
 * 24 hours — in Supabase, not localStorage, so it holds regardless of
 * which device or which person in the pair opens the app next.
 */
function sortedIds(personIds: string[]): string[] {
  return [...new Set(personIds)].sort();
}

export async function lockGroupFor24h(personIds: string[]): Promise<string> {
  const supabase = createClient();
  const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("evening_locks").insert({
    person_ids: sortedIds(personIds),
    locked_until: lockedUntil,
  });
  if (error) throw error;

  return lockedUntil;
}

/** The soonest this exact group can pick again, or null if it isn't locked. */
export async function activeLockFor(personIds: string[]): Promise<string | null> {
  if (personIds.length === 0) return null;

  const supabase = createClient();
  const target = sortedIds(personIds);

  const { data, error } = await supabase
    .from("evening_locks")
    .select("locked_until")
    .filter("person_ids", "eq", `{${target.join(",")}}`)
    .order("locked_until", { ascending: false })
    .limit(1);

  if (error) throw error;

  const until = data?.[0]?.locked_until as string | undefined;
  if (!until) return null;
  return new Date(until) > new Date() ? until : null;
}
