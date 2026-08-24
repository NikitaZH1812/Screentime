"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICT, type Lang } from "./i18n";

const KEY = "screentime.lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof DICT)["en"];
};

const LangContext = createContext<Ctx | null>(null);

/**
 * English by default so server and first client render match. After mount,
 * an explicit choice from localStorage wins; absent that, the browser's own
 * language decides — Ukrainian only if it says so, English otherwise.
 */
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored === "en" || stored === "uk") {
        setLangState(stored);
        return;
      }
    } catch {
      // ignore
    }
    if (navigator.language?.toLowerCase().startsWith("uk")) {
      setLangState("uk");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      // A blocked store must never break the switch itself.
    }
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICT[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
