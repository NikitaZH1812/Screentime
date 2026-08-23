/** Client-safe TMDB URL helpers. No API key involved. */

export function posterUrl(path: string | null, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function watchUrl(tmdbId: number) {
  return `https://www.themoviedb.org/movie/${tmdbId}/watch`;
}
