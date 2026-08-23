"use client";

import { useState } from "react";
import { posterUrl, watchUrl } from "@/lib/tmdbUrls";
import type { Pick, RefusalReason } from "@/lib/types";

const REASONS: { value: RefusalReason; label: string; note: string }[] = [
  { value: "already_seen", label: "вже бачили", note: "наша провина" },
  {
    value: "unavailable",
    label: "нема або без української",
    note: "наша провина",
  },
  { value: "not_tonight", label: "не сьогодні", note: "просто не те" },
];

function runtimeLabel(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}год ${m}хв` : `${m}хв`;
}

export default function PickScreen({
  pick,
  busy,
  onRefuse,
}: {
  pick: Pick;
  busy: boolean;
  onRefuse: (reason: RefusalReason) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const poster = posterUrl(pick.poster_path);

  return (
    <>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="mb-6 w-full rounded-2xl"
        />
      )}

      <h1 className="text-2xl font-semibold">{pick.title}</h1>
      <p className="mt-1 text-sm text-white/40">
        {[pick.year, runtimeLabel(pick.runtime)].filter(Boolean).join(" · ")}
      </p>

      <p className="mt-5 text-[15px] leading-relaxed text-white/80">
        {pick.reason}
      </p>

      <div className="mt-auto pt-10">
        <a
          href={watchUrl(pick.tmdb_id)}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-2xl bg-white py-4 text-center font-semibold text-black"
        >
          Дивитись
        </a>

        {!sheet ? (
          <button
            type="button"
            onClick={() => setSheet(true)}
            disabled={busy}
            className="mt-3 w-full py-3 text-sm text-white/40 disabled:opacity-40"
          >
            {busy ? "Шукаю інше…" : "не це"}
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  setSheet(false);
                  onRefuse(r.value);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-sm"
              >
                <span>{r.label}</span>
                <span className="text-xs text-white/30">{r.note}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSheet(false)}
              className="w-full py-2 text-sm text-white/30"
            >
              відміна
            </button>
          </div>
        )}
      </div>
    </>
  );
}
