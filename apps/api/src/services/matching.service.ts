import { AppDataSource } from '../db/data-source';
import { RoundSong } from '../db/entities/RoundSong';

export interface MatchResult {
  matchTitle: boolean;
  matchArtist: boolean;
  matchGroup: boolean;
  points: number;
  normalizedAnswer: string;
  titleSimilarity: number;
  artistSimilarity: number;
  groupSimilarity: number;
}

/**
 * Service de matching intelligent pour la correction des réponses
 * Implémente la normalisation, distance de Levenshtein, et gestion des alias
 */
export class MatchingService {
  // Seuils de similarité par défaut (configurables par événement)
  private defaultThreshold = 80; // 80% de similarité minimum

  /**
   * Normalise un texte pour la comparaison
   * - Minuscules
   * - Suppression des accents
   * - Suppression de la ponctuation
   * - Suppression des articles (le/la/les/the/a/an)
   * - Suppression des tokens spéciaux (feat./ft./remix/&)
   */
  normalize(text: string): string {
    if (!text) return '';

    let normalized = text.toLowerCase().trim();

    // Supprimer les accents
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Supprimer la ponctuation sauf espaces
    normalized = normalized.replace(/[^\w\s]/g, ' ');

    // Supprimer les articles au début
    normalized = normalized.replace(/^(le|la|les|the|a|an)\s+/i, '');

    // Supprimer les tokens spéciaux
    normalized = normalized.replace(/\b(feat|ft|featuring|remix|remastered?|version|edit|official|audio|video)\b/gi, '');

    // Supprimer le symbole &
    normalized = normalized.replace(/&/g, 'and');

    // Nettoyer les espaces multiples
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   * Retourne le nombre minimum d'éditions (insertions, suppressions, substitutions)
   */
  levenshteinDistance(a: string, b: string): number {
    if (!a) return b.length;
    if (!b) return a.length;

    const matrix: number[][] = [];

    // Initialiser la première colonne
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // Initialiser la première ligne
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Remplir la matrice
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // suppression
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Calcule le pourcentage de similarité entre deux chaînes (0-100%)
   * Basé sur la distance de Levenshtein
   * Note: Normalise les chaînes avant de les comparer
   */
  similarity(a: string, b: string): number {
    if (!a || !b) return 0;

    // Normaliser avant comparaison pour ignorer casse, accents, etc.
    const normalizedA = this.normalize(a);
    const normalizedB = this.normalize(b);

    if (normalizedA === normalizedB) return 100;

    const maxLength = Math.max(normalizedA.length, normalizedB.length);
    if (maxLength === 0) return 100;

    const distance = this.levenshteinDistance(normalizedA, normalizedB);
    return Math.round(((maxLength - distance) / maxLength) * 100);
  }

  /**
   * Vérifie si deux chaînes correspondent selon le seuil de similarité
   */
  isMatch(a: string, b: string, threshold?: number): boolean {
    const th = threshold ?? this.defaultThreshold;
    return this.similarity(a, b) >= th;
  }

  /**
   * Parse les alias depuis le JSON stocké en base
   */
  parseAliases(aliasesJson?: string): { title: string[], artist: string[] } {
    if (!aliasesJson) return { title: [], artist: [] };

    try {
      const parsed = JSON.parse(aliasesJson);
      if (Array.isArray(parsed)) {
        const titleAliases = parsed
          .filter(a => !a.includes('artist:'))
          .map(a => this.normalize(a));
        const artistAliases = parsed
          .filter(a => a.includes('artist:'))
          .map(a => this.normalize(a.replace('artist:', '').trim()));
        return { title: titleAliases, artist: artistAliases };
      }
      return { title: [], artist: [] };
    } catch (error) {
      console.error('Error parsing aliases:', error);
      return { title: [], artist: [] };
    }
  }

  /**
   * Vérifie si une réponse correspond au titre officiel ou à un alias
   */
  matchWithAliases(answer: string, official: string, aliases: string[], threshold?: number): boolean {
    const normalizedAnswer = this.normalize(answer);
    const normalizedOfficial = this.normalize(official);

    // Vérifier correspondance exacte
    if (normalizedAnswer === normalizedOfficial) return true;

    // Vérifier correspondance avec seuil
    if (this.isMatch(normalizedAnswer, normalizedOfficial, threshold)) return true;

    // Vérifier les alias
    for (const alias of aliases) {
      if (normalizedAnswer === alias || this.isMatch(normalizedAnswer, alias, threshold)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Score une réponse selon les nouvelles règles du jeu :
   * - 2 points si Titre + (Artiste OU Groupe)
   * - 1 point si Titre seul OU (Artiste/Groupe seul)
   * - 0 point sinon
   *
   * Le joueur écrit tout dans un seul champ, le système détecte automatiquement
   * ce qui correspond au titre, artiste ou groupe.
   * Priorité si ambiguïté : Groupe > Artiste > Titre
   */
  async scoreAnswer(
    answerText: string,
    roundSongId: string,
    threshold?: number
  ): Promise<MatchResult> {
    // Récupérer le morceau officiel
    const songRepo = AppDataSource.getRepository(RoundSong);
    const song = await songRepo.findOne({ where: { id: roundSongId } });

    if (!song) {
      throw new Error('SONG_NOT_FOUND');
    }

    const normalizedAnswer = this.normalize(answerText);
    const normalizedOfficialTitle = this.normalize(song.title_official || '');
    const normalizedOfficialArtist = this.normalize(song.artist_official || '');
    const normalizedOfficialGroup = this.normalize(song.group_official || '');

    // Parser les alias
    const aliases = this.parseAliases(song.aliases_json);

    // Flags de matching
    let matchTitle = false;
    let matchArtist = false;
    let matchGroup = false;

    // Similarités
    let titleSimilarity = 0;
    let artistSimilarity = 0;
    let groupSimilarity = 0;

    // Stratégie : tester chaque mot/token de la réponse contre titre/artiste/groupe
    // avec priorité Groupe > Artiste > Titre

    const words = normalizedAnswer.split(/\s+/).filter(w => w.length > 0);
    const fullAnswer = normalizedAnswer;

    // 1. Vérifier correspondance avec le GROUPE (priorité haute)
    if (normalizedOfficialGroup) {
      // Tester la réponse complète
      if (this.isMatch(fullAnswer, normalizedOfficialGroup, threshold)) {
        matchGroup = true;
        groupSimilarity = this.similarity(fullAnswer, normalizedOfficialGroup);
      }

      // Tester les mots individuels et combinaisons
      if (!matchGroup) {
        for (let i = 0; i < words.length; i++) {
          for (let j = i + 1; j <= words.length; j++) {
            const phrase = words.slice(i, j).join(' ');
            if (this.isMatch(phrase, normalizedOfficialGroup, threshold)) {
              matchGroup = true;
              groupSimilarity = this.similarity(phrase, normalizedOfficialGroup);
              break;
            }
          }
          if (matchGroup) break;
        }
      }
    }

    // 2. Vérifier correspondance avec l'ARTISTE (priorité moyenne)
    if (normalizedOfficialArtist) {
      // Tester la réponse complète
      if (this.isMatch(fullAnswer, normalizedOfficialArtist, threshold)) {
        matchArtist = true;
        artistSimilarity = this.similarity(fullAnswer, normalizedOfficialArtist);
      }

      // Tester les mots individuels et combinaisons
      if (!matchArtist) {
        for (let i = 0; i < words.length; i++) {
          for (let j = i + 1; j <= words.length; j++) {
            const phrase = words.slice(i, j).join(' ');
            if (this.isMatch(phrase, normalizedOfficialArtist, threshold)) {
              matchArtist = true;
              artistSimilarity = this.similarity(phrase, normalizedOfficialArtist);
              break;
            }
          }
          if (matchArtist) break;
        }
      }
    }

    // 3. Vérifier correspondance avec le TITRE (priorité basse)
    if (normalizedOfficialTitle) {
      // Tester la réponse complète
      if (this.isMatch(fullAnswer, normalizedOfficialTitle, threshold)) {
        matchTitle = true;
        titleSimilarity = this.similarity(fullAnswer, normalizedOfficialTitle);
      }

      // Tester avec alias
      if (!matchTitle) {
        matchTitle = this.matchWithAliases(
          fullAnswer,
          normalizedOfficialTitle,
          aliases.title,
          threshold
        );
        titleSimilarity = this.similarity(fullAnswer, normalizedOfficialTitle);
      }

      // Tester les mots individuels et combinaisons
      if (!matchTitle) {
        for (let i = 0; i < words.length; i++) {
          for (let j = i + 1; j <= words.length; j++) {
            const phrase = words.slice(i, j).join(' ');
            if (this.isMatch(phrase, normalizedOfficialTitle, threshold)) {
              matchTitle = true;
              titleSimilarity = this.similarity(phrase, normalizedOfficialTitle);
              break;
            }
          }
          if (matchTitle) break;
        }
      }
    }

    // Calculer les points selon les nouvelles règles
    let points = 0;

    // 2 points : Titre + (Artiste OU Groupe)
    if (matchTitle && (matchArtist || matchGroup)) {
      points = 2;
    }
    // 1 point : Titre seul OU (Artiste/Groupe seul)
    else if (matchTitle || matchArtist || matchGroup) {
      points = 1;
    }
    // 0 point sinon

    return {
      matchTitle,
      matchArtist,
      matchGroup,
      points,
      normalizedAnswer,
      titleSimilarity,
      artistSimilarity,
      groupSimilarity
    };
  }

  /**
   * Suggère automatiquement des alias basés sur les réponses des joueurs
   * (à utiliser pour améliorer progressivement le système)
   */
  suggestAliases(
    playerAnswers: string[],
    officialTitle: string,
    officialArtist: string
  ): string[] {
    const suggestions: string[] = [];
    const normalizedOfficial = this.normalize(officialTitle);

    for (const answer of playerAnswers) {
      const normalized = this.normalize(answer);

      // Si la similarité est haute mais pas exacte, suggérer comme alias
      const sim = this.similarity(normalized, normalizedOfficial);
      if (sim >= 70 && sim < 100 && normalized !== normalizedOfficial) {
        if (!suggestions.includes(answer)) {
          suggestions.push(answer);
        }
      }
    }

    return suggestions;
  }

  /**
   * Met à jour le seuil de similarité par défaut
   */
  setDefaultThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 100) {
      throw new Error('Threshold must be between 0 and 100');
    }
    this.defaultThreshold = threshold;
  }
}

// Export singleton instance
export const matchingService = new MatchingService();
