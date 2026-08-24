"use client";

import { posterUrl, watchUrl } from "@/lib/tmdbUrls";
import {
  brainChipLabel,
  eraChipLabel,
  timeChipLabel,
} from "@/lib/eveningLabels";
import type { BrainLevel, Era, Pick, TimeBucket } from "@/lib/types";

function runtimeLabel(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}год ${m}хв` : `${m}хв`;
}

export default function PickScreen({
  pick,
  busy,
  onAlreadySeen,
  onWatched,
  onNotTonight,
  context,
}: {
  pick: Pick;
  busy: boolean;
  onAlreadySeen: () => void;
  onWatched: () => void;
  onNotTonight: () => void;
  context: {
    time: TimeBucket;
    brain: BrainLevel;
    era: Era;
    genreWish: string | null;
  };
}) {
  const poster = posterUrl(pick.poster_path);

  // Makes the dials visibly felt: this is what was actually used to pick.
  const tags = [
    timeChipLabel(context.time),
    brainChipLabel(context.brain),
    eraChipLabel(context.era),
    context.genreWish,
  ].filter((t): t is string => Boolean(t));

  return (
    <>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="mb-6 w-full rounded-2xl" />
      )}

      <h1 className="text-2xl font-semibold">{pick.title}</h1>
      <p className="mt-1 text-sm text-white/40">
        {[pick.year, runtimeLabel(pick.runtime)].filter(Boolean).join(" · ")}
      </p>

      {tags.length > 0 && (
        <p className="mt-3 text-xs text-white/25">{tags.join(" · ")}</p>
      )}

      <p className="mt-5 text-[15px] leading-relaxed text-white/80">
        {pick.reason}
      </p>

      <div className="mt-auto space-y-2 pt-10">
        <a
          href={watchUrl(pick.tmdb_id)}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-2xl border border-white/15 py-4 text-center font-semibold text-white"
        >
          Детальніше
        </a>

        <button
          type="button"
          onClick={onWatched}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black"
        >
          Подивились
        </button>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onAlreadySeen}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm text-white/60 disabled:opacity-40"
          >
            вже бачили
          </button>
          <button
            type="button"
            onClick={onNotTonight}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm text-white/60 disabled:opacity-40"
          >
            {busy ? "хвилинку…" : "не сьогодні"}
          </button>
        </div>
      </div>
    </>
  );
}
