"use client";

import { useState } from "react";
import { useLang } from "@/lib/LangContext";
import LangToggle from "../components/LangToggle";

/** A few explainer slides shown once before the first login — the last tap on
 * the last slide hands off straight to sign-in, no separate "start" step. */
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const slides = t.onboarding.slides;
  const last = step === slides.length - 1;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <div className="flex items-center justify-between">
        <LangToggle />
        <button
          type="button"
          onClick={onDone}
          className="text-xs text-white/25"
        >
          {t.onboarding.skip}
        </button>
      </div>

      <div key={step} className="screen-enter flex flex-1 flex-col justify-center">
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-accent">
          {slides[step].title}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
          {slides[step].body}
        </p>
      </div>

      <div className="mt-auto pt-10">
        <div className="mb-4 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-accent" : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (last ? onDone() : setStep((s) => s + 1))}
          className="w-full rounded-2xl bg-accent py-4 font-semibold text-accent-fg transition hover:bg-accent-strong active:scale-[0.97]"
        >
          {last ? t.onboarding.getStarted : t.onboarding.next}
        </button>
      </div>
    </main>
  );
}
