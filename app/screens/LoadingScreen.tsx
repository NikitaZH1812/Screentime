"use client";

import { useLang } from "@/lib/LangContext";

export default function LoadingScreen() {
  const { t } = useLang();
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="accent-pulse h-8 w-8 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
      <p className="mt-4 text-sm text-white/40">{t.loading}</p>
    </div>
  );
}
