"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Passwordless on purpose: one tap from an email, nothing to remember. The
 * same "remove the need to think" instinct that keeps the rest of the
 * product to two dials and one button.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
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

      <form onSubmit={send} className="w-full">
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
          className="mt-3 w-full rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-30"
        >
          {busy ? "Надсилаю…" : "Надіслати посилання"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </main>
  );
}
