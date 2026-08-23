"use client";

import { useEffect, useRef, useState } from "react";
import { posterUrl } from "@/lib/tmdbUrls";
import type { FilmRef } from "@/lib/types";

function label(f: FilmRef) {
  return f.year ? `${f.title} (${f.year})` : f.title;
}

export default function FilmSearch({
  value,
  onChange,
  placeholder,
}: {
  value: FilmRef[];
  onChange: (next: FilmRef[]) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FilmRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [broken, setBroken] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        // A slower earlier request must never overwrite a newer one.
        if (mine !== seq.current) return;
        if (!res.ok) {
          setBroken(true);
          setResults([]);
        } else {
          setBroken(false);
          setResults(data as FilmRef[]);
        }
      } catch {
        if (mine === seq.current) setBroken(true);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function add(film: FilmRef) {
    if (!value.some((f) => f.tmdb_id === film.tmdb_id && f.title === film.title)) {
      onChange([...value, film]);
    }
    setQuery("");
    setResults([]);
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {value.map((f) => {
            const thumb = posterUrl(f.poster_path, "w92");
            return (
              <div
                key={`${f.tmdb_id}-${f.title}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-2"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-12 w-8 rounded object-cover" />
                ) : (
                  <div className="h-12 w-8 rounded bg-white/10" />
                )}
                <span className="flex-1 truncate text-sm">{label(f)}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== f))}
                  className="px-2 text-xs text-white/30"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          // With search down, typing a title by hand still has to work.
          if (e.key === "Enter" && broken && query.trim()) {
            e.preventDefault();
            add({
              tmdb_id: null,
              title: query.trim(),
              year: null,
              poster_path: null,
            });
          }
        }}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] placeholder:text-white/25 focus:border-white/30 focus:outline-none"
      />

      {loading && <p className="mt-2 text-xs text-white/25">шукаю…</p>}

      {broken && !loading && query.trim().length >= 2 && (
        <p className="mt-2 text-xs text-white/30">
          пошук не працює — Enter, щоб додати назву вручну
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((f) => {
            const thumb = posterUrl(f.poster_path, "w92");
            return (
              <button
                key={f.tmdb_id}
                type="button"
                onClick={() => add(f)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-12 w-8 rounded object-cover" />
                ) : (
                  <div className="h-12 w-8 rounded bg-white/10" />
                )}
                <span className="flex-1 truncate text-sm">{label(f)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
