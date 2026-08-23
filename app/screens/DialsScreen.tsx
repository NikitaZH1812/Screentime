"use client";

import { useState } from "react";
import type { BrainLevel, Era, TimeBucket } from "@/lib/types";
// The evening wish: deliberately tiny and hidden behind a toggle. A situational
// bias, not a mood picker, and it never reaches a person's profile.
import { WISH_GENRES } from "@/lib/genres";

const TIME: { value: TimeBucket; label: string }[] = [
  { value: "short", label: "менше 1.5 год" },
  { value: "medium", label: "десь 2 год" },
  { value: "any", label: "не важливо" },
];

const BRAIN: { value: BrainLevel; label: string }[] = [
  { value: "low", label: "на нулі — щось легке" },
  { value: "normal", label: "є сили — можна складніше" },
];

const ERA: { value: Era; label: string }[] = [
  { value: "old", label: "перевірене старе" },
  { value: "any", label: "без різниці" },
  { value: "new", label: "щось нове" },
];

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
      className={`rounded-full border px-4 py-2.5 text-sm transition ${
        on
          ? "border-white bg-white text-black"
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
  kidsInRoom,
  onTime,
  onBrain,
  onGenreWish,
  onEra,
  onKidsInRoom,
  onBack,
  onPick,
  busy,
}: {
  time: TimeBucket;
  brain: BrainLevel;
  genreWish: string | null;
  era: Era;
  kidsInRoom: boolean;
  onTime: (v: TimeBucket) => void;
  onBrain: (v: BrainLevel) => void;
  onGenreWish: (v: string | null) => void;
  onEra: (v: Era) => void;
  onKidsInRoom: (v: boolean) => void;
  onBack: () => void;
  onPick: () => void;
  busy?: boolean;
}) {
  const [wishOpen, setWishOpen] = useState(genreWish !== null);

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-8 self-start text-sm text-white/40"
      >
        ← назад
      </button>

      <Row label="Скільки часу є">
        {TIME.map((t) => (
          <Chip key={t.value} on={time === t.value} onClick={() => onTime(t.value)}>
            {t.label}
          </Chip>
        ))}
      </Row>

      <Row
        label="Скільки лишилось сил"
        hint="визначає, наскільки просте чи важке за сюжетом обирати"
      >
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

      <Row label="Хто в кімнаті">
        <Chip on={!kidsInRoom} onClick={() => onKidsInRoom(false)}>
          тільки дорослі
        </Chip>
        <Chip on={kidsInRoom} onClick={() => onKidsInRoom(true)}>
          є діти
        </Chip>
      </Row>

      <Row label="Старе чи нове">
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
        className="mb-4 self-start text-sm text-white/40 underline underline-offset-4"
      >
        {wishOpen ? "− без конкретики" : "+ хочеться чогось конкретного"}
      </button>

      {wishOpen && (
        <div className="mb-8 flex flex-wrap gap-2">
          {WISH_GENRES.map((g) => (
            <Chip
              key={g}
              on={genreWish === g}
              onClick={() => onGenreWish(genreWish === g ? null : g)}
            >
              {g}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={onPick}
          disabled={busy}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-40"
        >
          {busy ? "Шукаю…" : "Підібрати"}
        </button>
      </div>
    </>
  );
}
