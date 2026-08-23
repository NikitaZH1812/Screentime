import type { FeedbackLogEntry, RefusalLogEntry } from "./types";

/**
 * The refusal log is a V1 feature, not analytics we add later.
 *
 * Availability is user-declared in V1 — no API tells us whether a film is
 * really on their services with Ukrainian audio. Every `unavailable` refusal
 * is therefore the only evidence we will have when we decide, in a month,
 * whether the availability API is unnecessary or is the whole product.
 *
 * In-memory for now: no database in this build. It lives as long as the
 * server process does.
 */
type Store = {
  refusals: RefusalLogEntry[];
  feedback: FeedbackLogEntry[];
};

const globalStore = globalThis as unknown as { __screentimeLog?: Store };

const store: Store = (globalStore.__screentimeLog ??= {
  refusals: [],
  feedback: [],
});

export function logRefusal(entry: RefusalLogEntry) {
  store.refusals.push(entry);
  console.log(
    `[refusal] ${entry.timestamp} · ${entry.group.join(" + ")} · "${entry.title}" (${entry.tmdb_id}) · ${entry.reason} · підписки: ${entry.declared_subscriptions.join(", ")} · укр. аудіо потрібне: ${entry.requires_ukrainian_audio}`,
  );
}

export function logFeedback(entry: FeedbackLogEntry) {
  store.feedback.push(entry);
  console.log(
    `[feedback] ${entry.timestamp} · ${entry.group.join(" + ")} · "${entry.title}" · watched=${entry.watched} liked=${entry.liked}`,
  );
}

export function readLog(): Store & { availability_failure_rate: string } {
  const availabilityMisses = store.refusals.filter(
    (r) => r.reason === "unavailable",
  ).length;
  const total = store.refusals.length;

  return {
    ...store,
    availability_failure_rate:
      total === 0 ? "—" : `${((availabilityMisses / total) * 100).toFixed(0)}%`,
  };
}
