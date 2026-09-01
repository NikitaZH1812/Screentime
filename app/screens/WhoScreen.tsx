"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/LangContext";
import type { Person } from "@/lib/types";
import LangToggle from "../components/LangToggle";

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function summary(p: Person, banned: (n: number) => string) {
  const bits: string[] = [];
  if (p.good_examples.length) {
    bits.push(
      p.good_examples
        .slice(0, 2)
        .map((f) => f.title)
        .join(", "),
    );
  }
  const bannedCount = p.genre_exclusions.length + p.type_exclusions.length;
  if (bannedCount) bits.push(banned(bannedCount));
  return bits.join(" · ");
}

function countdown(untilIso: string, now: number): string {
  const ms = new Date(untilIso).getTime() - now;
  if (ms <= 0) return "0:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WhoScreen({
  profiles,
  loading,
  selected,
  lockUntil,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
  onNext,
  onSignOut,
  onHistory,
}: {
  profiles: Person[];
  loading: boolean;
  selected: string[];
  /** Set only when the exact selected group is locked out. */
  lockUntil: string | null;
  onToggle: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNext: () => void;
  onSignOut: () => void;
  onHistory: () => void;
}) {
  const { t } = useLang();
  const [now, setNow] = useState(() => Date.now());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (!lockUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  // Ticks toward zero locally rather than trusting lockUntil's mere presence —
  // otherwise "Далі" stays disabled forever once the countdown hits zero,
  // until something re-triggers the parent's Supabase check.
  const locked = lockUntil !== null && new Date(lockUntil).getTime() > now;

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t.who.title}
        </h1>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button type="button" onClick={onSignOut} className="text-xs text-white/25">
            {t.who.signOut}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[15px] text-white/30">{t.who.loading}</p>
      ) : profiles.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-white/40">{t.who.empty}</p>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const on = selected.includes(p.id);
            const confirming = confirmingId === p.id;
            return (
              <div
                key={p.id}
                className={`flex items-start gap-2 rounded-2xl border p-3 transition ${
                  on
                    ? "border-accent bg-accent/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold transition ${
                      on ? "bg-accent text-accent-fg" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{p.name}</span>
                    {summary(p, t.who.banned) && (
                      <span className="block truncate text-xs text-white/30">
                        {summary(p, t.who.banned)}
                      </span>
                    )}
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1 pt-1">
                  {confirming ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingId(null);
                          onDelete(p.id);
                        }}
                        className="whitespace-nowrap px-2 py-1 text-xs text-red-400"
                      >
                        {t.who.deleteConfirm}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="whitespace-nowrap px-2 py-1 text-xs text-white/30"
                      >
                        {t.who.cancel}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(p.id)}
                        className="whitespace-nowrap px-2 py-1 text-xs text-white/30"
                      >
                        {t.who.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(p.id)}
                        className="px-2 py-1 text-xs text-white/20"
                      >
                        {t.who.delete}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onHistory}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-strong active:scale-[0.97]"
            >
              <span>{t.who.historyLink}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onCreate}
        className="mt-4 w-full rounded-2xl border border-dashed border-white/15 py-3.5 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent active:scale-[0.98]"
      >
        {t.who.newProfile}
      </button>

      <div className="mt-auto pt-10">
        {locked && lockUntil && (
          <p className="mb-3 text-center text-sm text-white/40">
            {t.who.lockedUntil(countdown(lockUntil, now))}
          </p>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={selected.length === 0 || locked}
          className="w-full rounded-2xl bg-accent py-4 font-semibold text-accent-fg transition hover:bg-accent-strong active:scale-[0.97] disabled:opacity-25 disabled:active:scale-100"
        >
          {t.who.next}
        </button>
      </div>
    </>
  );
}
