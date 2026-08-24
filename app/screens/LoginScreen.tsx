"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Passwordless on purpose: one tap, nothing to remember. Google is the
 * primary path — no email quota of our own to worry about as this grows
 * past one household. Email link stays as a fallback behind a toggle for
 * anyone who'd rather not link a Google account.
 */
export default function LoginScreen() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withGoogle() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser navigates away to Google — nothing left to do here.
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <p className="text-xl font-semibold">Перевір пошту</p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/50">
          Надіслали посилання на {email}. Тапни його — і ти всередині.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5">
      <h1 className="mb-1 text-xl font-semibold">Screentime</h1>
      <p className="mb-8 text-sm text-white/40">одне посилання, без паролів</p>

      <button
        type="button"
        onClick={withGoogle}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-30"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.61z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
          />
        </svg>
        {busy ? "Хвилинку…" : "Продовжити з Google"}
      </button>

      {!showEmail ? (
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="mt-4 text-sm text-white/30"
        >
          або через email
        </button>
      ) : (
        <form onSubmit={withEmail} className="mt-4 w-full">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="твій email"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] placeholder:text-white/25 focus:border-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 font-semibold disabled:opacity-30"
          >
            {busy ? "Надсилаю…" : "Надіслати посилання"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </main>
  );
}
