"use client";

import { useEffect, useState } from "react";
import { loadProfiles, saveProfiles } from "@/lib/profiles";
import type {
  BrainLevel,
  Era,
  Person,
  Pick,
  RefusalReason,
  TimeBucket,
} from "@/lib/types";
import WhoScreen from "./screens/WhoScreen";
import ProfileForm from "./screens/ProfileForm";
import DialsScreen from "./screens/DialsScreen";
import PickScreen from "./screens/PickScreen";
import ClosedScreen from "./screens/ClosedScreen";
import FeedbackScreen from "./screens/FeedbackScreen";

type Stage = "who" | "profile" | "dials" | "pick" | "closed" | "feedback";

export default function EveningFlow() {
  const [stage, setStage] = useState<Stage>("who");
  const [profiles, setProfiles] = useState<Person[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personIds, setPersonIds] = useState<string[]>([]);

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

  useEffect(() => setProfiles(loadProfiles()), []);

  function persist(next: Person[]) {
    setProfiles(next);
    saveProfiles(next);
  }

  const selectedPeople = profiles.filter((p) => personIds.includes(p.id));

  async function fetchPick(excludeIds: number[], refused: string[]) {
    setBusy(true);
    setError(null);
    try {
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
          excludeIds,
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

  /**
   * The lock sits on taste, not on our own data gaps.
   *
   * already_seen and unavailable are our failures — they replace instantly
   * and never count. not_tonight is theirs: it buys exactly one replacement,
   * and the second one closes the evening.
   */
  async function refuse(reason: RefusalReason) {
    if (!pick) return;

    void fetch("/api/refuse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        people: selectedPeople,
        tmdb_id: pick.tmdb_id,
        title: pick.title,
        reason,
      }),
    });

    const nextSeen = [...seenIds, pick.tmdb_id];
    setSeenIds(nextSeen);

    if (reason !== "not_tonight") {
      await fetchPick(nextSeen, refusedTitles);
      return;
    }

    const count = notTonightCount + 1;
    setNotTonightCount(count);
    const nextRefused = [...refusedTitles, pick.title];
    setRefusedTitles(nextRefused);

    if (count >= 2) {
      setStage("closed");
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
          selected={personIds}
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
            persist(profiles.filter((p) => p.id !== id));
            setPersonIds((prev) => prev.filter((p) => p !== id));
          }}
          onNext={() => setStage("dials")}
        />
      )}

      {stage === "profile" && (
        <ProfileForm
          initial={profiles.find((p) => p.id === editingId)}
          onSave={(person) => {
            const exists = profiles.some((p) => p.id === person.id);
            persist(
              exists
                ? profiles.map((p) => (p.id === person.id ? person : p))
                : [...profiles, person],
            );
            setStage("who");
          }}
          onCancel={() => setStage("who")}
        />
      )}

      {stage === "dials" && (
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
      )}

      {stage === "pick" && pick && (
        <PickScreen
          pick={pick}
          busy={busy}
          onRefuse={refuse}
          context={{ time, brain, era, genreWish, kidsInRoom }}
        />
      )}

      {stage === "closed" && <ClosedScreen onRestart={restart} />}

      {stage === "feedback" && pick && (
        <FeedbackScreen
          pick={pick}
          onAnswer={(watched, liked) => {
            void fetch("/api/feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                people: selectedPeople,
                tmdb_id: pick.tmdb_id,
                title: pick.title,
                watched,
                liked,
              }),
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

      {pick && stage === "pick" && (
        <button
          type="button"
          onClick={() => setStage("feedback")}
          className="mt-6 self-center text-xs text-white/15"
        >
          симулювати наступний день
        </button>
      )}
    </main>
  );
}
