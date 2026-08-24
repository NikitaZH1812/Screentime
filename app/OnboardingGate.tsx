"use client";

import { useEffect, useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import Onboarding from "./screens/Onboarding";

const KEY = "screentime.onboarded";

/**
 * Only reached when there's no logged-in user (app/page.tsx handles that
 * check server-side). First visit ever: walk through the explainer, ending
 * on login. Anyone who's seen it — or come back after a session expired —
 * goes straight to login, no repeat tour.
 */
export default function OnboardingGate() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setOnboarded(window.localStorage.getItem(KEY) === "1");
    } catch {
      // A blocked store must never trap someone behind the tour forever.
      setOnboarded(true);
    }
  }, []);

  function finish() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setOnboarded(true);
  }

  // Briefly null while the localStorage check runs — imperceptible, and far
  // better than flashing the tour to someone who's already seen it.
  if (onboarded === null) return null;
  return onboarded ? <LoginScreen /> : <Onboarding onDone={finish} />;
}
