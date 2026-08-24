/**
 * Supabase throws PostgrestError-shaped objects, not real Error instances —
 * `e instanceof Error` silently misses every one of them and falls back to
 * a generic message, hiding exactly the detail needed to debug a failed
 * query. This checks for a `.message` string on anything, not just Error.
 */
export function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return fallback;
}
