/**
 * Calcule les points selon les règles :
 * - 2 points : Titre + (Artiste OU Groupe)
 * - 1 point : Titre seul OU (Artiste/Groupe seul)
 * - 0 point : Rien de correct
 */
export function computePoints(
  matchTitle: boolean,
  matchArtist: boolean,
  matchGroup?: boolean,
): 0 | 1 | 2 {
  // 2 points : Titre + (Artiste OU Groupe)
  if (matchTitle && (matchArtist || matchGroup)) {
    return 2;
  }

  // 1 point : Titre seul OU (Artiste/Groupe seul)
  if (matchTitle || matchArtist || matchGroup) {
    return 1;
  }

  // 0 point
  return 0;
}
