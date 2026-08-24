import { missingSupabaseKeys } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import EveningFlow from "./EveningFlow";
import OnboardingGate from "./OnboardingGate";

export const preferredRegion = "dub1";

export default async function Home() {
  const missing = missingSupabaseKeys();
  if (missing.length > 0) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <p className="text-[15px] leading-relaxed text-white/50">
          Не налаштовано: {missing.join(", ")}. Локально — у .env.local, на
          Vercel — у Settings → Environment Variables, і потім Redeploy.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <OnboardingGate />;
  return <EveningFlow />;
}
