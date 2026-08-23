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
