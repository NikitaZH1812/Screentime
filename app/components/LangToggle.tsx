"use client";

import { useLang } from "@/lib/LangContext";

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex shrink-0 rounded-full border border-white/10 p-0.5 text-xs">
      {(["en", "uk"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 transition active:scale-95 ${
            lang === l ? "bg-accent text-accent-fg" : "text-white/35"
          }`}
        >
          {l === "en" ? "EN" : "UA"}
        </button>
      ))}
    </div>
  );
}
