"use client";

import { useState } from "react";
import { useLang } from "@/lib/LangContext";
import type { BrainLevel, Era, TimeBucket } from "@/lib/types";
// The evening wish: deliberately tiny and hidden behind a toggle. A situational
// bias, not a mood picker, and it never reaches a person's profile.
import { genreLabel, WISH_GENRES } from "@/lib/genres";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="mb-1 text-sm text-white/40">{label}</p>
      {hint && <p className="mb-3 text-xs text-white/25">{hint}</p>}
      {!hint && <div className="mb-3" />}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm transition active:scale-95 ${
        on
          ? "border-accent bg-accent text-accent-fg"
          : "border-white/10 bg-white/[0.03] text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

export default function DialsScreen({
  time,
  brain,
  genreWish,
  era,
  onTime,
  onBrain,
  onGenreWish,
  onEra,
  onBack,
  onPick,
}: {
  time: TimeBucket;
  brain: BrainLevel;
  genreWish: string | null;
  era: Era;
  onTime: (v: TimeBucket) => void;
  onBrain: (v: BrainLevel) => void;
  onGenreWish: (v: string | null) => void;
  onEra: (v: Era) => void;
  onBack: () => void;
  onPick: () => void;
}) {
  const { t, lang } = useLang();
  const [wishOpen, setWishOpen] = useState(genreWish !== null);

  const TIME: { value: TimeBucket; label: string }[] = [
    { value: "short", label: t.dials.timeShort },
    { value: "medium", label: t.dials.timeMedium },
    { value: "any", label: t.dials.timeAny },
  ];

  const BRAIN: { value: BrainLevel; label: string }[] = [
    { value: "low", label: t.dials.brainLow },
    { value: "normal", label: t.dials.brainNormal },
  ];

  const ERA: { value: Era; label: string }[] = [
    { value: "old", label: t.dials.eraOld },
    { value: "any", label: t.dials.eraAny },
    { value: "new", label: t.dials.eraNew },
  ];

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-8 self-start text-sm text-white/40"
      >
        {t.dials.back}
      </button>

      <Row label={t.dials.time}>
        {TIME.map((opt) => (
          <Chip key={opt.value} on={time === opt.value} onClick={() => onTime(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </Row>

      <Row label={t.dials.brain} hint={t.dials.brainHint}>
        {BRAIN.map((b) => (
          <Chip
            key={b.value}
            on={brain === b.value}
            onClick={() => onBrain(b.value)}
          >
            {b.label}
          </Chip>
        ))}
      </Row>

      <Row label={t.dials.era}>
        {ERA.map((e) => (
          <Chip key={e.value} on={era === e.value} onClick={() => onEra(e.value)}>
            {e.label}
          </Chip>
        ))}
      </Row>

      <button
        type="button"
        onClick={() => {
          const next = !wishOpen;
          setWishOpen(next);
          if (!next) onGenreWish(null);
        }}
        className="mb-4 self-start text-sm text-white/40 underline underline-offset-4 transition hover:text-accent"
      >
        {wishOpen ? t.dials.wishClose : t.dials.wishOpen}
      </button>

      {wishOpen && (
        <div className="mb-8 flex flex-wrap gap-2">
          {WISH_GENRES.map((g) => (
            <Chip
              key={g}
              on={genreWish === g}
              onClick={() => onGenreWish(genreWish === g ? null : g)}
            >
              {genreLabel(g, lang)}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={onPick}
          className="w-full rounded-2xl bg-accent py-4 font-semibold text-accent-fg transition hover:bg-accent-strong active:scale-[0.97]"
        >
          {t.dials.pick}
        </button>
      </div>
    </>
  );
}
