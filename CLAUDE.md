# CLAUDE.md — Screentime

> Project context for Claude Code. Read this before writing any code.
> Rules marked **HARD RULE** are the product. Do not simplify, generalize,
> or "improve" them without being explicitly asked.

---

## What this is

**Screentime** picks **one** film for **tonight** for **the people currently in the room**
— usually a couple.

The user opens it, taps who is watching, sets two dials, and gets a single title
with a play link and one line explaining why. That is the entire interaction.
Target: under 15 seconds from open to decision.

The problem being solved is not "I don't know what's good."
It is "we spend 20 minutes negotiating and then watch nothing."

## The one thing that must not be lost

**Removing the need to think.**

Every feature request, every refactor, every "we could also show..." must be
checked against this. If it adds a decision for the user, it is wrong by default.

**HARD RULE: never show a list of options.** One title. Not three. Not "here are
some picks." A list returns the decision to the user and destroys the product.

**HARD RULE: never show an empty state.** If constraints yield nothing, relax the
soft ones and say so in the explanation line ("no horror on your services tonight
— closest thing:"). An empty screen in a product that promises "open and press
play" kills trust in one shot.

---

## Data model — three levels, never mixed

This is the core of the design. Collapsing any two of these levels is the most
likely way this product breaks.

### 1. Person — permanent exclusions
- Belongs to an individual. Persists forever. Accumulates over time.
- **Hard** filters: they remove candidates completely.
- Examples: "no medieval fantasy", "no musicals", "no subtitles".
- Also holds 2–3 reference films given at onboarding.

### 2. Evening — situational wish
- Belongs to a single session. **Dies when the session ends.**
- **Soft**: a strong bias, never an obligation.
- Example: "tonight we want horror" → strongly prefer horror, but if nothing
  decent is available, return the closest thing and say why.
- **HARD RULE: an evening wish must never be written to the permanent profile.**
  Wanting horror twice a month does not make someone a horror fan. Letting this
  leak poisons the profile within weeks.

### 3. Combination — positive taste
- Belongs to a **group of people**, not to individuals. `[person_a, person_b]` is
  its own entity with its own history.
- Learned **only** from next-day feedback (watched / liked).
- **HARD RULE: never compute a group's positive taste as an average or
  intersection of individual tastes.** A couple watches things neither person
  would pick alone. "Something in between" is a film nobody likes.
- Exclusions *do* combine across people (union of all hard exclusions).
  Preferences do not.

### Unknown combination fallback
A new group (`[a, b, c]` when only `[a, b]` has history) starts with:
union of all members' hard exclusions + what worked for known sub-groups inside it.

---

## Refusal mechanics

The product is deliberately strict: no infinite reroll. But the lock sits on
**taste**, not on our own data gaps.

Refusal is always **one tap with a reason**. Three reasons:

| Reason | Whose fault | Behaviour | Counts as a miss? |
|---|---|---|---|
| `already_seen` | ours | instant replacement | no |
| `no_ukrainian_audio` / `unavailable` | ours | instant replacement | no |
| `not_tonight` (taste) | theirs | **one** replacement, then evening closes | yes |

After the second `not_tonight`, close the evening warmly: "not our night — see
you tomorrow." Do not offer a third.

**HARD RULE: the "watched / did you like it" prompt is NOT a gate.**
It appears the next day, separately, and never as a condition for getting another
recommendation. If people must press "watched" to unlock the next pick, half of
those presses will be lies — and that button is the *only* source of positive
signal for the combination profile. A lock and a data-collection input must never
be the same button.

---

## Recommendation architecture

**HARD RULE: the model never invents titles.**

```
1. Retrieve candidates from TMDB using HARD constraints only
   (permanent exclusions, runtime, already-seen, declared subscriptions)
2. Pass the candidate list + group context + evening dials to the model
3. Model picks exactly ONE and writes the one-line reason
```

Data filters. The model chooses. Reversed, you get confident hallucinations —
films that don't exist, or don't exist on their services.

**The explanation line is mandatory, not decoration.** With five options, a miss
is the user's fault. With one, it is entirely ours. The reason is what makes a
miss read as "it doesn't know us yet" instead of "this thing is random."
Format: taste anchor + availability + practical fit.
e.g. "You both liked *Prisoners*; it's on Megogo with Ukrainian audio, 1h50."

---

## Input rules

### Onboarding (once, must stay under ~60 seconds)
- 2–3 reference films per person
- which subscriptions they have
- is Ukrainian audio required: yes / no

**Do not ask "what don't you like?" as a list.** People answer that badly — they
don't remember in the abstract. Exclusions are harvested from refusals instead:
on a refusal, one tap — *just this once* / *never again*. The second button writes
a permanent exclusion, captured at the moment the person is annoyed and remembers
exactly why.

### At time of use
Maximum **two or three** controls, all numeric or binary:
- how much time we have
- how much brain we have left

**HARD RULE: no free-text mood field, no list of twelve moods.** Mood is inferred
from the dials plus the fact that it's 11pm on a Tuesday. The moment we ask the
user to describe their mood, we've handed thinking back to them and become a
worse version of a chatbot with extra UI.

---

## Scope

V1 shipped. Scope now evolves feature-by-feature rather than being fixed up
front — but the process stays the same: something on the **Out** list is a
deliberate exclusion, not a permanent ban. Building it requires an explicit
ask, not a silent "while I'm in there." When that ask happens, move the item
from Out to In in this file as part of the same change, so the doc keeps
matching what actually shipped instead of arguing with it.

### In
- Multiple people/profiles, each with their own permanent exclusions + references
- "Who's watching tonight" — 2 taps, this is the key to everything, not a filter
- Two situational dials
- One recommendation + reason + link
- Refusal with reason (3 reasons above)
- Next-day feedback prompt (separate, non-blocking)
- **Refusal reason log** — see below
- Group watch history: past picks for a combination, with the binary
  watched/liked feedback already collected — not a numeric rating

### Out
Voice, TV apps, social features, numeric ratings, series,
multi-day planning, streaming availability API, native mobile app.

### Availability in V1 — deliberately user-declared
No availability API for now. The user states their subscriptions and whether
Ukrainian audio is required; that goes into context and the model does its best,
and will sometimes be wrong.

**This makes the refusal log load-bearing.** Every `no_ukrainian_audio` and
`unavailable` refusal must be recorded with the title, the person's declared
services, and the date.

**HARD RULE: this log is a V1 feature, not "analytics we'll add later."**
It is the only reason we'll be able to decide about the availability API in a
month with a number instead of a hunch. Under ~5% of evenings failing this way
means the API is unnecessary. Around 30% means it is the whole product.

---

## Stack

- Next.js on Vercel — web first (deploy in seconds, shareable link, no app store
  gate for the first users)
- Supabase — database + auth
- TMDB — metadata, posters, candidate retrieval
- Anthropic API called directly — one well-built prompt with structured output.
  No agent frameworks, no orchestration.

---

## Working conventions

- **Commit after every working change**, not at the end of the day. Each commit is
  a restore point back to "everything was fine here."
- Prefer small, reviewable diffs. The person reading them is a product manager,
  not an engineer — a diff that can't be skimmed can't be approved.
- Do not add features that weren't asked for. Do not "improve" the constraints
  above into something more flexible.
- When something is ambiguous, ask one question rather than guessing and building.
- Keep the codebase small enough to hold in one head. This is a product with one
  screen.
