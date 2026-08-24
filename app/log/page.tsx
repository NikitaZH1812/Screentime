import { redirect } from "next/navigation";
import { missingSupabaseKeys } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  // Home renders the "not configured" message; no need to duplicate it here.
  if (missingSupabaseKeys().length > 0) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: refusals }, { data: feedback }, { data: people }] = await Promise.all([
    supabase
      .from("refusal_log")
      .select(
        "id, person_names, tmdb_id, title, reason, declared_subscriptions, requires_ukrainian_audio, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("combination_feedback")
      .select("id, person_ids, tmdb_id, title, watched, liked, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("people").select("id, name"),
  ]);

  const nameById = new Map((people ?? []).map((p) => [p.id, p.name]));
  const feedbackWithNames = (feedback ?? []).map((f) => ({
    ...f,
    group: f.person_ids.map((id: string) => nameById.get(id) ?? "?"),
  }));

  const total = refusals?.length ?? 0;
  const availabilityMisses =
    refusals?.filter((r) => r.reason === "unavailable").length ?? 0;
  const availabilityFailureRate =
    total === 0 ? "—" : `${Math.round((availabilityMisses / total) * 100)}%`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-xl font-semibold">Refusal log</h1>
      <p className="mb-6 text-sm text-white/40">
        {total} відмов · {feedbackWithNames.length} відповідей · доступність
        провалилась у {availabilityFailureRate} відмов
      </p>
      <pre className="overflow-x-auto rounded-xl bg-white/[0.03] p-4 text-xs leading-relaxed text-white/70">
        {JSON.stringify(
          { availability_failure_rate: availabilityFailureRate, refusals, feedback: feedbackWithNames },
          null,
          2,
        )}
      </pre>
    </main>
  );
}
