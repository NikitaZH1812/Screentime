"use client";

import { useEffect, useState } from "react";
import { historyFor, recordFeedback, subgroupSignals } from "@/lib/combinations";
import { activeLockFor, lockGroupFor24h } from "@/lib/locks";
import { needsUkrainianAudio, unionSubscriptions } from "@/lib/people";
import { deleteProfile, loadProfiles, saveProfile } from "@/lib/profiles";
import { logRefusal } from "@/lib/refusalLog";
import { createClient } from "@/lib/supabase/client";
import type {
  BrainLevel,
  CombinationContext,
  Era,
  Person,
  Pick,
  TimeBucket,
} from "@/lib/types";
import WhoScreen from "./screens/WhoScreen";
import ProfileForm from "./screens/ProfileForm";
import DialsScreen from "./screens/DialsScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PickScreen from "./screens/PickScreen";
import FeedbackScreen from "./screens/FeedbackScreen";

type Stage = "who" | "profile" | "dials" | "pick" | "feedback";

export default function EveningFlow() {
  const [stage, setStage] = useState<Stage>("who");
  const [profiles, setProfiles] = useState<Person[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [lockUntil, setLockUntil] = useState<string | null>(null);

  const [time, setTime] = useState<TimeBucket>("medium");
  const [brain, setBrain] = useState<BrainLevel>("low");
  const [genreWish, setGenreWish] = useState<string | null>(null);
  const [era, setEra] = useState<Era>("any");
  const [kidsInRoom, setKidsInRoom] = useState(false);

  const [pick, setPick] = useState<Pick | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session-only evening state. None of this is ever written to a profile.
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [refusedTitles, setRefusedTitles] = useState<string[]>([]);
  const [notTonightCount, setNotTonightCount] = useState(0);

  useEffect(() => {
    loadProfiles()
      .then(setProfiles)
      .catch((e) => setError(e instanceof Error ? e.message : "Не вдалося завантажити профілі"))
      .finally(() => setProfilesLoading(false));
  }, []);

  // Checked against whatever is currently selected — a different pairing
  // than the one that said "не сьогодні" is never blocked by that lock.
  useEffect(() => {
    if (personIds.length === 0) {
      setLockUntil(null);
      return;
    }
    activeLockFor(personIds)
      .then(setLockUntil)
      .catch(() => setLockUntil(null));
  }, [personIds]);

  const selectedPeople = profiles.filter((p) => personIds.includes(p.id));

  async function fetchPick(excludeIds: number[], refused: string[]) {
    setBusy(true);
    setError(null);
    try {
      const [history, subgroups] = await Promise.all([
        historyFor(personIds),
        subgroupSignals(personIds),
      ]);
      const nameById = new Map(profiles.map((p) => [p.id, p.name]));
      const combination: CombinationContext = {
        history,
        subgroups: subgroups.map((s) => ({
          names: s.personIds.map((id) => nameById.get(id) ?? "?"),
          history: s.history,
        })),
      };

      // "Already seen" is a hard constraint per the architecture — and for
      // this exact group, we actually know what that means: whatever they've
      // already watched together, liked or not. Without this, the same film
      // keeps winning every evening once it's the strongest taste anchor.
      const alreadyWatched = history.filter((h) => h.watched).map((h) => h.tmdb_id);
      const excludeWithHistory = [...new Set([...excludeIds, ...alreadyWatched])];

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          people: selectedPeople,
          time,
          brain,
          genreWish,
          era,
          kidsInRoom,
          combination,
          excludeIds: excludeWithHistory,
          refusedTitles: refused,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Не вдалося підібрати");
      setPick(data as Pick);
      setStage("pick");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Щось пішло не так");
    } finally {
      setBusy(false);
    }
  }

  /** already_seen — our failure. Instant replacement, never counted. */
  async function handleAlreadySeen() {
    if (!pick) return;

    void logRefusal({
      personNames: selectedPeople.map((p) => p.name),
      tmdb_id: pick.tmdb_id,
      title: pick.title,
      reason: "already_seen",
      declaredSubscriptions: unionSubscriptions(selectedPeople),
      requiresUkrainianAudio: needsUkrainianAudio(selectedPeople),
    });

    const nextSeen = [...seenIds, pick.tmdb_id];
    setSeenIds(nextSeen);
    await fetchPick(nextSeen, refusedTitles);
  }

  /**
   * not_tonight — theirs. One replacement; the second locks this exact
   * group out for 24h instead of showing a dead-end screen.
   */
  async function handleNotTonight() {
    if (!pick) return;

    void logRefusal({
      personNames: selectedPeople.map((p) => p.name),
      tmdb_id: pick.tmdb_id,
      title: pick.title,
      reason: "not_tonight",
      declaredSubscriptions: unionSubscriptions(selectedPeople),
      requiresUkrainianAudio: needsUkrainianAudio(selectedPeople),
    });

    const nextSeen = [...seenIds, pick.tmdb_id];
    setSeenIds(nextSeen);

    const count = notTonightCount + 1;
    setNotTonightCount(count);
    const nextRefused = [...refusedTitles, pick.title];
    setRefusedTitles(nextRefused);

    if (count >= 2) {
      setBusy(true);
      try {
        const until = await lockGroupFor24h(personIds);
        setLockUntil(until);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не вдалося зберегти паузу");
      } finally {
        setBusy(false);
      }
      // Back to "who" with the same people still selected, so the lock and
      // its countdown are visible immediately instead of vanishing on reset.
      setStage("who");
      setPick(null);
      setSeenIds([]);
      setRefusedTitles([]);
      setNotTonightCount(0);
      return;
    }
    await fetchPick(nextSeen, nextRefused);
  }

  function restart() {
    setStage("who");
    setPersonIds([]);
    setPick(null);
    setSeenIds([]);
    setRefusedTitles([]);
    setNotTonightCount(0);
    setError(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      {stage === "who" && (
        <WhoScreen
          profiles={profiles}
          loading={profilesLoading}
          selected={personIds}
          lockUntil={lockUntil}
          onToggle={(id) =>
            setPersonIds((prev) =>
              prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
            )
          }
          onCreate={() => {
            setEditingId(null);
            setStage("profile");
          }}
          onEdit={(id) => {
            setEditingId(id);
            setStage("profile");
          }}
          onDelete={(id) => {
            setPersonIds((prev) => prev.filter((p) => p !== id));
            deleteProfile(id)
              .then(() => setProfiles((prev) => prev.filter((p) => p.id !== id)))
              .catch((e) => setError(e instanceof Error ? e.message : "Не вдалося видалити"));
          }}
          onNext={() => setStage("dials")}
          onSignOut={() => {
            void createClient()
              .auth.signOut()
              .then(() => window.location.reload());
          }}
        />
      )}

      {stage === "profile" && (
        <ProfileForm
          initial={profiles.find((p) => p.id === editingId)}
          onSave={(person) => {
            const isNew = !person.id;
            saveProfile(person, isNew)
              .then((saved) => {
                setProfiles((prev) =>
                  isNew
                    ? [...prev, saved]
                    : prev.map((p) => (p.id === saved.id ? saved : p)),
                );
                setStage("who");
              })
              .catch((e) =>
                setError(e instanceof Error ? e.message : "Не вдалося зберегти профіль"),
              );
          }}
          onCancel={() => setStage("who")}
        />
      )}

      {stage === "dials" && (busy ? (
        <LoadingScreen />
      ) : (
        <DialsScreen
          time={time}
          brain={brain}
          genreWish={genreWish}
          era={era}
          kidsInRoom={kidsInRoom}
          onTime={setTime}
          onBrain={setBrain}
          onGenreWish={setGenreWish}
          onEra={setEra}
          onKidsInRoom={setKidsInRoom}
          onBack={() => setStage("who")}
          onPick={() => fetchPick(seenIds, refusedTitles)}
          busy={busy}
        />
      ))}

      {stage === "pick" && pick && (
        <PickScreen
          pick={pick}
          busy={busy}
          onAlreadySeen={handleAlreadySeen}
          onWatched={() => setStage("feedback")}
          onNotTonight={handleNotTonight}
          context={{ time, brain, era, genreWish, kidsInRoom }}
        />
      )}

      {stage === "feedback" && pick && (
        <FeedbackScreen
          pick={pick}
          onAnswer={(watched, liked) => {
            void recordFeedback(personIds, {
              tmdb_id: pick.tmdb_id,
              title: pick.title,
              watched,
              liked,
            });
            restart();
          }}
          onDismiss={restart}
        />
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </main>
  );
}
