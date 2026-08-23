"use client";

import type { Person } from "@/lib/types";

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export default function WhoScreen({
  people,
  selected,
  onToggle,
  onNext,
}: {
  people: Person[];
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h1 className="mb-8 text-xl font-semibold">Хто дивиться</h1>

      <div className="grid grid-cols-3 gap-3">
        {people.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                on
                  ? "border-white bg-white/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold ${
                  on ? "bg-white text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {initials(p.name)}
              </span>
              <span className="text-sm">{p.name}</span>
            </button>
          );
        })}
      </div>

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
