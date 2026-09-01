"use client";

import { useLang } from "@/lib/LangContext";
import { posterUrl } from "@/lib/tmdbUrls";
import type { CombinationFeedback } from "@/lib/types";

function formatDate(iso: string, lang: "en" | "uk") {
  return new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** The group's own watch history — past picks with the binary watched/liked
 * feedback already collected via FeedbackScreen. Read-only: no new rating UI. */
export default function HistoryScreen({
  entries,
  loading,
  onBack,
}: {
  entries: CombinationFeedback[];
  loading: boolean;
  onBack: () => void;
}) {
  const { t, lang } = useLang();

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-8 self-start text-sm text-white/40"
      >
        {t.history.back}
      </button>

      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        {t.history.title}
      </h1>

      {loading ? (
        <p className="text-[15px] text-white/30">{t.history.loading}</p>
      ) : sorted.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-white/40">{t.history.empty}</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((e, i) => {
            const thumb = posterUrl(e.poster_path, "w92");
            return (
              <div
                key={`${e.tmdb_id}-${e.timestamp}-${i}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-16 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-11 shrink-0 rounded-lg bg-white/10" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px]">{e.title}</span>
                    <span className="shrink-0 text-xs text-white/25">
                      {formatDate(e.timestamp, lang)}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs ${
                      e.watched && e.liked
                        ? "text-accent"
                        : e.watched
                          ? "text-white/40"
                          : "text-white/25"
                    }`}
                  >
                    {!e.watched
                      ? t.history.notWatched
                      : e.liked
                        ? t.history.liked
                        : t.history.disliked}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
