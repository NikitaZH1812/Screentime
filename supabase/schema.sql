-- Screentime schema.
-- Run this once in the Supabase SQL Editor (Database → SQL Editor → New query).
-- Safe to re-run: every statement is idempotent.

create extension if not exists "pgcrypto";

-- Level 1: people. Owned by whoever is logged in; RLS scopes every row.
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  genre_exclusions text[] not null default '{}',
  type_exclusions text[] not null default '{}',
  good_examples jsonb not null default '[]',
  bad_examples jsonb not null default '[]',
  subscriptions text[] not null default '{}',
  requires_ukrainian_audio boolean not null default false,
  created_at timestamptz not null default now()
);

alter table people enable row level security;

drop policy if exists "people are owner-scoped" on people;
create policy "people are owner-scoped" on people
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Level 3: combination feedback. Belongs to the exact group (person_ids,
-- sorted), never to any one person in it. person_ids must be sorted by the
-- caller — exact-match queries rely on array equality, and subgroup queries
-- rely on <@ containment.
create table if not exists combination_feedback (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_ids uuid[] not null,
  tmdb_id bigint not null,
  title text not null,
  watched boolean not null,
  liked boolean,
  created_at timestamptz not null default now()
);

-- Added after the table already existed in production — denormalized here
-- for the same reason title is: the history screen shouldn't have to hit
-- TMDB again just to render a poster for something already watched.
alter table combination_feedback add column if not exists poster_path text;

alter table combination_feedback enable row level security;

drop policy if exists "combination feedback is owner-scoped" on combination_feedback;
create policy "combination feedback is owner-scoped" on combination_feedback
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists combination_feedback_person_ids_idx
  on combination_feedback using gin (person_ids);

-- The refusal log. Was in-memory (died on every serverless cold start) —
-- now durable, and naturally scoped per household instead of pooling
-- everyone's refusals into one process-wide array.
create table if not exists refusal_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_names text[] not null,
  tmdb_id bigint not null,
  title text not null,
  -- 'unavailable' stays in the allowed set for backward compatibility with
  -- historical rows even though the UI no longer offers it as a reason.
  reason text not null check (reason in ('already_seen', 'unavailable', 'not_tonight')),
  declared_subscriptions text[] not null default '{}',
  requires_ukrainian_audio boolean not null default false,
  created_at timestamptz not null default now()
);

alter table refusal_log enable row level security;

drop policy if exists "refusal log is owner-scoped" on refusal_log;
create policy "refusal log is owner-scoped" on refusal_log
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- The second "не сьогодні" this evening locks that exact group for 24h.
-- Scoped to the group (not the browser) so it holds regardless of who in
-- the pair opens the app next, and survives a refresh. Insert-only: a
-- lock check takes the latest still-future locked_until for the group.
create table if not exists evening_locks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person_ids uuid[] not null,
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);

alter table evening_locks enable row level security;

drop policy if exists "evening locks are owner-scoped" on evening_locks;
create policy "evening locks are owner-scoped" on evening_locks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
