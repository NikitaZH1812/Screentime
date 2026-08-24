import { createClient } from "./supabase/client";
import type { FilmRef, Person } from "./types";

/**
 * Profiles live in Supabase now, scoped to the logged-in owner by RLS.
 * The row shape mirrors Person exactly except for owner_id, which the
 * database fills in itself (default auth.uid()) and RLS enforces — the
 * client never needs to know or send it.
 */
type Row = {
  id: string;
  name: string;
  genre_exclusions: string[];
  type_exclusions: string[];
  good_examples: FilmRef[];
  bad_examples: FilmRef[];
  subscriptions: string[];
  requires_ukrainian_audio: boolean;
};

function fromRow(r: Row): Person {
  return {
    id: r.id,
    name: r.name,
    genre_exclusions: r.genre_exclusions,
    type_exclusions: r.type_exclusions,
    good_examples: r.good_examples,
    bad_examples: r.bad_examples,
    subscriptions: r.subscriptions,
    requires_ukrainian_audio: r.requires_ukrainian_audio,
  };
}

export async function loadProfiles(): Promise<Person[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      "id, name, genre_exclusions, type_exclusions, good_examples, bad_examples, subscriptions, requires_ukrainian_audio",
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

/** Insert if the profile has no id yet from the database, update otherwise. */
export async function saveProfile(person: Person, isNew: boolean): Promise<Person> {
  const supabase = createClient();
  const row = {
    name: person.name,
    genre_exclusions: person.genre_exclusions,
    type_exclusions: person.type_exclusions,
    good_examples: person.good_examples,
    bad_examples: person.bad_examples,
    subscriptions: person.subscriptions,
    requires_ukrainian_audio: person.requires_ukrainian_audio,
  };

  if (isNew) {
    const { data, error } = await supabase
      .from("people")
      .insert(row)
      .select(
        "id, name, genre_exclusions, type_exclusions, good_examples, bad_examples, subscriptions, requires_ukrainian_audio",
      )
      .single();
    if (error) throw error;
    return fromRow(data as Row);
  }

  const { error } = await supabase.from("people").update(row).eq("id", person.id);
  if (error) throw error;
  return person;
}

export async function deleteProfile(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw error;
}
