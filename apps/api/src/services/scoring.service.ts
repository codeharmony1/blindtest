export function computePoints(
  matchTitle: boolean,
  matchArtist: boolean,
): 0 | 1 | 2 {
  if (matchTitle && matchArtist) return 2;
  if (matchTitle || matchArtist) return 1;
  return 0;
}
