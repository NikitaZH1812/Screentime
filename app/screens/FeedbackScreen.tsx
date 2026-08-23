"use client";

import { useState } from "react";
import type { Pick } from "@/lib/types";

/**
 * The next-day prompt. It is NOT a gate: nothing about getting another
 * recommendation depends on answering it. It is also the only source of
 * positive signal for a group's taste, which is exactly why it must never
 * double as a lock — half of those presses would be lies.
 */
export default function FeedbackScreen({
  pick,
  onAnswer,
  onDismiss,
}: {
  pick: Pick;
  onAnswer: (watched: boolean, liked: boolean | null) => void;
  onDismiss: () => void;
}) {
  const [watched, setWatched] = useState<boolean | null>(null);

  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="text-sm text-white/40">Вчора ми запропонували</p>
      <p className="mt-1 text-xl font-semibold">{pick.title}</p>

      {watched === null ? (
        <>
          <p className="mt-8 text-[15px] text-white/70">Подивились?</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setWatched(true)}
              className="flex-1 rounded-2xl bg-white py-4 font-semibold text-black"
            >
              так
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false, null)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-4"
            >
              ні
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-8 text-[15px] text-white/70">Зайшло?</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onAnswer(true, true)}
              className="flex-1 rounded-2xl bg-white py-4 font-semibold text-black"
            >
              так
            </button>
            <button
              type="button"
              onClick={() => onAnswer(true, false)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-4"
            >
              не дуже
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="mt-8 self-center text-sm text-white/25"
      >
        пізніше
      </button>
    </div>
  );
}
