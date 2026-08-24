/**
 * Keys live in .env.local locally and in Vercel's environment variables in
 * production — two separate stores. Missing one is the single most likely
 * reason a fresh deploy fails, so say which one plainly instead of letting
 * it surface as a stack trace from inside an SDK.
 */
export function missingKeys(): string[] {
  const missing: string[] = [];
  if (!process.env.TMDB_API_KEY) missing.push("TMDB_API_KEY");
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  return missing;
}

/**
 * Supabase env vars are read with a non-null assertion at every call site
 * that needs them (client/server/middleware) — without this check first,
 * a missing var doesn't fail gracefully, it throws from inside the SDK on
 * literally every request, including the middleware that runs before any
 * page renders.
 */
export function missingSupabaseKeys(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return missing;
}
