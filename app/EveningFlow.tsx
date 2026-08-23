"use client";

import { useState } from "react";
import type { BrainLevel, Person, TimeBucket } from "@/lib/types";
import WhoScreen from "./screens/WhoScreen";
import DialsScreen from "./screens/DialsScreen";

type Stage = "who" | "dials";

export default function EveningFlow({ people }: { people: Person[] }) {
  const [stage, setStage] = useState<Stage>("who");
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [time, setTime] = useState<TimeBucket>("medium");
  const [brain, setBrain] = useState<BrainLevel>("low");
  const [genreWish, setGenreWish] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      {stage === "who" && (
        <WhoScreen
          people={people}
          selected={personIds}
          onToggle={(id) =>
            setPersonIds((prev) =>
              prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
            )
          }
          onNext={() => setStage("dials")}
        />
      )}

      {stage === "dials" && (
        <DialsScreen
          time={time}
          brain={brain}
          genreWish={genreWish}
          onTime={setTime}
          onBrain={setBrain}
          onGenreWish={setGenreWish}
          onBack={() => setStage("who")}
          onPick={() => {}}
        />
      )}
    </main>
  );
}
