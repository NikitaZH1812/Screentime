import { readLog } from "@/lib/refusalLog";

export const dynamic = "force-dynamic";

export default function LogPage() {
  const log = readLog();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-xl font-semibold">Refusal log</h1>
      <p className="mb-6 text-sm text-white/40">
        {log.refusals.length} відмов · {log.feedback.length} відповідей ·
        доступність провалилась у {log.availability_failure_rate} відмов
      </p>
      <pre className="overflow-x-auto rounded-xl bg-white/[0.03] p-4 text-xs leading-relaxed text-white/70">
        {JSON.stringify(log, null, 2)}
      </pre>
    </main>
  );
}
