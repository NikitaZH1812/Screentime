"use client";

import type { Person } from "@/lib/types";

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function summary(p: Person) {
  const bits: string[] = [];
  if (p.good_examples.length) bits.push(p.good_examples.slice(0, 2).join(", "));
  const banned = p.genre_exclusions.length + p.type_exclusions.length;
  if (banned) bits.push(`${banned} заборон`);
  return bits.join(" · ");
}

export default function WhoScreen({
  profiles,
  selected,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
  onNext,
}: {
  profiles: Person[];
  selected: string[];
  onToggle: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h1 className="mb-8 text-xl font-semibold">Хто дивиться</h1>

      {profiles.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-white/40">
          Тут поки нікого. Створи перший профіль — це займе хвилину і робиться
          один раз.
        </p>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const on = selected.includes(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  on ? "border-white bg-white/10" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${
                      on ? "bg-white text-black" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{p.name}</span>
                    {summary(p) && (
                      <span className="block truncate text-xs text-white/30">
                        {summary(p)}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(p.id)}
                  className="px-2 py-1 text-xs text-white/30"
                >
                  змінити
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="px-2 py-1 text-xs text-white/20"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onCreate}
        className="mt-4 w-full rounded-2xl border border-dashed border-white/15 py-3.5 text-sm text-white/50"
      >
        + новий профіль
      </button>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={onNext}
          disabled={selected.length === 0}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-25"
        >
          Далі
        </button>
      </div>
    </>
  );
}
