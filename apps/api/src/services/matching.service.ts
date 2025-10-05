import { AppDataSource } from '../db/data-source';
import { RoundSong } from '../db/entities/RoundSong';

export interface MatchResult {
  matchTitle: boolean;
  matchArtist: boolean;
  points: number;
  normalizedAnswer: string;
  titleSimilarity: number;
  artistSimilarity: number;
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
   */
  similarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 100;

    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 100;

    const distance = this.levenshteinDistance(a, b);
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
   * Score une réponse selon les règles du jeu
   * - 2 points si Titre ET Artiste corrects
   * - 1 point si Titre OU Artiste correct
   * - 0 point sinon
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

    // Parser la réponse (format attendu: "Titre - Artiste" ou "Titre" seul)
    let answerTitle = '';
    let answerArtist = '';

    if (answerText.includes('-')) {
      const parts = answerText.split('-').map(p => p.trim());
      answerTitle = parts[0] || '';
      answerArtist = parts[1] || '';
    } else {
      answerTitle = answerText.trim();
    }

    // Normaliser les éléments
    const normalizedAnswerTitle = this.normalize(answerTitle);
    const normalizedAnswerArtist = this.normalize(answerArtist);
    const normalizedOfficialTitle = this.normalize(song.title_official || '');
    const normalizedOfficialArtist = this.normalize(song.artist_official || '');

    // Parser les alias
    const aliases = this.parseAliases(song.aliases_json);

    // Vérifier correspondance titre
    const matchTitle = this.matchWithAliases(
      normalizedAnswerTitle,
      normalizedOfficialTitle,
      aliases.title,
      threshold
    );

    // Calculer similarité titre
    const titleSimilarity = this.similarity(normalizedAnswerTitle, normalizedOfficialTitle);

    // Vérifier correspondance artiste (si fourni)
    let matchArtist = false;
    let artistSimilarity = 0;

    if (normalizedAnswerArtist) {
      matchArtist = this.matchWithAliases(
        normalizedAnswerArtist,
        normalizedOfficialArtist,
        aliases.artist,
        threshold
      );
      artistSimilarity = this.similarity(normalizedAnswerArtist, normalizedOfficialArtist);
    }

    // Calculer les points
    let points = 0;
    if (matchTitle && matchArtist) {
      points = 2;
    } else if (matchTitle || matchArtist) {
      points = 1;
    }

    return {
      matchTitle,
      matchArtist,
      points,
      normalizedAnswer,
      titleSimilarity,
      artistSimilarity
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
