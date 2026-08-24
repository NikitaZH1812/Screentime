"use client";

import { useLang } from "@/lib/LangContext";
import { posterUrl, watchUrl } from "@/lib/tmdbUrls";
import {
  brainChipLabel,
  eraChipLabel,
  timeChipLabel,
} from "@/lib/eveningLabels";
import { genreLabel } from "@/lib/genres";
import type { BrainLevel, Era, Pick, TimeBucket } from "@/lib/types";

function runtimeLabel(minutes: number | null, t: (h: number, m: number) => string) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return t(h, m);
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
  const { t, lang } = useLang();
  const poster = posterUrl(pick.poster_path);

  // Makes the dials visibly felt: this is what was actually used to pick.
  const tags = [
    timeChipLabel(context.time, lang),
    brainChipLabel(context.brain, lang),
    eraChipLabel(context.era, lang),
    context.genreWish ? genreLabel(context.genreWish, lang) : null,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="poster-enter mb-6 w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(227,164,88,0.35)]"
        />
      )}

      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight">
        {pick.title}
      </h1>
      <p className="mt-1 text-sm text-white/40">
        {[pick.year, runtimeLabel(pick.runtime, t.pick.runtime)]
          .filter(Boolean)
          .join(" · ")}
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
          className="block w-full rounded-2xl border border-white/15 py-4 text-center font-semibold text-white transition hover:border-accent/50 active:scale-[0.98]"
        >
          {t.pick.details}
        </a>

        <button
          type="button"
          onClick={onWatched}
          className="w-full rounded-2xl bg-accent py-4 font-semibold text-accent-fg transition hover:bg-accent-strong active:scale-[0.97]"
        >
          {t.pick.watched}
        </button>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onAlreadySeen}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm text-white/60 transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          >
            {t.pick.alreadySeen}
          </button>
          <button
            type="button"
            onClick={onNotTonight}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm text-white/60 transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          >
            {busy ? t.pick.busy : t.pick.notTonight}
          </button>
        </div>
      </div>
    </>
  );
}

