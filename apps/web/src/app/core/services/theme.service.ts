import { Injectable, DOCUMENT } from '@angular/core';
import { Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { PREDEFINED_THEMES, ThemeConfig, ThemeColors, getThemeById, getThemesByCategory, DEFAULT_THEME } from '../../../../../api/src/types/themes';

export type { ThemeConfig, ThemeColors };

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeConfig | null>(null);
  public currentTheme$ = this.currentThemeSubject.asObservable();
  private ambientEl: HTMLElement | null = null;

  private readonly defaultTheme: ThemeConfig = DEFAULT_THEME;

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.initializeTheme();
  }

  private initializeTheme() {
    // Charge le thème par défaut au démarrage
    this.applyTheme(this.defaultTheme);
  }

  // Charge le thème d'un événement spécifique
  loadEventTheme(eventCode: string): Observable<any> {
    return new Observable((observer) => {
      this.http.get<any>(`/api/events/${eventCode}/theme`).subscribe({
        next: (response) => {
          if (response.theme) {
            this.applyTheme(response.theme);
            observer.next(response.theme);
          } else {
            this.applyTheme(this.defaultTheme);
            observer.next(this.defaultTheme);
          }
          observer.complete();
        },
        error: (error) => {
          console.warn('Could not load event theme, using default:', error);
          this.applyTheme(this.defaultTheme);
          observer.next(this.defaultTheme);
          observer.complete();
        },
      });
    });
  }

  // Applique un thème à l'interface
  applyTheme(theme: ThemeConfig) {
    this.currentThemeSubject.next(theme);
    this.updateCSSVariables(theme);
    this.updateFonts(theme);
    this.updateAmbient(theme);
  }

  // Met à jour les variables CSS globales
  private updateCSSVariables(theme: ThemeConfig) {
    const root = this.document.documentElement;

    // Couleurs
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);

    if (theme.colors.gradient) {
      root.style.setProperty('--gradient-primary', theme.colors.gradient);
    }

    // Compat: map vers les variables existantes du thème "autumn-wedding"
    // Ceci permet d'appliquer dynamiquement les couleurs choisies dans les
    // écrans Joueur actuels qui reposent sur ces variables CSS.
    // Principales
    root.style.setProperty('--autumn-burgundy', theme.colors.primary);
    root.style.setProperty('--autumn-gold', theme.colors.secondary);
    root.style.setProperty('--autumn-orange', theme.colors.accent || theme.colors.secondary);
    root.style.setProperty('--autumn-cream', theme.colors.background);
    root.style.setProperty('--autumn-brown', theme.colors.text);
    root.style.setProperty('--autumn-copper', theme.colors.border || theme.colors.secondary);

    // Accents/variants
    // Valeurs de repli pour conserver un rendu harmonieux si non défini
    const lighten = (hex: string, amt = 0.1) => {
      try {
        const v = hex.replace('#', '');
        const num = parseInt(v, 16);
        const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(255 * amt)));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * amt)));
        const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * amt)));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
      } catch {
        return hex;
      }
    };

    const warmWhite = '#faf8f3';
    root.style.setProperty('--autumn-warm-white', theme.colors.surface || warmWhite);
    root.style.setProperty(
      '--autumn-soft-yellow',
      lighten(theme.colors.background || '#f5f5dc', 0.1),
    );
    root.style.setProperty('--autumn-deep-orange', theme.colors.accent || '#cc5500');
    root.style.setProperty('--autumn-rust', theme.colors.secondary || '#b7410e');

    // Ombres/effets — garder des valeurs par défaut agréables
    root.style.setProperty('--autumn-shadow', 'rgba(0, 0, 0, 0.2)');
    root.style.setProperty('--autumn-glow', 'rgba(212, 175, 55, 0.25)');
    root.style.setProperty('--autumn-overlay', 'rgba(0, 0, 0, 0.05)');

    // Fonts
    root.style.setProperty('--font-primary', theme.fonts.primary);
    root.style.setProperty('--font-heading', theme.fonts.heading);

    // Animations (si disponibles)
    if (theme.animations) {
      const durations = { fast: '0.2s', normal: '0.3s', slow: '0.5s' };
      root.style.setProperty(
        '--animation-duration',
        durations[theme.animations.duration] || '0.3s',
      );
      root.style.setProperty('--animation-easing', theme.animations.easing || 'ease-in-out');
    }
  }

  // Charge les polices Google Fonts si nécessaire
  private updateFonts(theme: ThemeConfig) {
    const fonts = [theme.fonts.primary, theme.fonts.heading];
    const googleFonts = fonts
      .filter(
        (font) => font.includes("'") && !font.includes('sans-serif') && !font.includes('serif'),
      )
      .map((font) => font.replace(/['"]/g, ''))
      .filter((font, index, self) => self.indexOf(font) === index); // Remove duplicates

    if (googleFonts.length > 0) {
      this.loadGoogleFonts(googleFonts);
    }
  }

  // Charge dynamiquement les polices Google Fonts
  private loadGoogleFonts(fontNames: string[]) {
    const existingLink = this.document.getElementById('google-fonts');
    if (existingLink) {
      existingLink.remove();
    }

    const fontQuery = fontNames.map((font) => font.replace(' ', '+')).join('|');

    const link = this.document.createElement('link');
    link.id = 'google-fonts';
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}:wght@300;400;500;600;700&display=swap`;

    this.document.head.appendChild(link);
  }

  // Ajoute une couche d'animation d'ambiance selon le thème sélectionné
  private updateAmbient(theme: ThemeConfig) {
    // Nettoyer l'existant
    if (this.ambientEl && this.ambientEl.parentElement) {
      this.ambientEl.parentElement.removeChild(this.ambientEl);
    }
    this.ambientEl = null;

    // Respecter le toggle utilisateur (stocké côté client)
    const ambientEnabled = localStorage.getItem('bt_enable_ambient') !== 'false';
    // Cas particulier du thème automne: masquer/afficher les feuilles
    const toggleAutumnLeaves = (show: boolean) => {
      try {
        const nodes = this.document.querySelectorAll('.autumn-leaves') as NodeListOf<HTMLElement>;
        nodes.forEach((el) => (el.style.display = show ? '' : 'none'));
      } catch {}
    };

    if (theme.id === 'wedding-autumn') {
      // Essayer d'utiliser les feuilles d'automne si présentes dans le DOM (pages Joueur/Affichage)
      let hasLeaves = false;
      try {
        hasLeaves = this.document.querySelectorAll('.autumn-leaves').length > 0;
      } catch {}
      toggleAutumnLeaves(ambientEnabled);
      // Si un calque de feuilles existe, on ne crée pas d'ambient overlay supplémentaire
      // (les feuilles suffisent et respectent déjà le toggle)
      if (hasLeaves || !ambientEnabled) {
        return;
      }
      // Sinon (ex: écran DJ), on propose un fallback discret via overlay
      // et on continue la création d'un ambient-layer ci-dessous.
    }

    if (!ambientEnabled) {
      // Rien à afficher pour les autres thèmes si désactivé
      return;
    }

    const ambient = this.document.createElement('div');
    ambient.className = 'ambient-layer';

    // Choisir une animation en fonction du contexte (priorité DJ) puis du thème
    const createNodes = (cls: string, count = 20, tag: 'span' | 'i' = 'span') => {
      ambient.classList.add(cls);
      for (let i = 0; i < count; i++) ambient.appendChild(this.document.createElement(tag));
    };

    // Détection de l'écran DJ (présence du conteneur principal)
    const isDJ = !!this.document.querySelector('.dj-deck');
    if (isDJ) {
      // Animation dédiée DJ: égaliseur réactif stylisé
      createNodes('anim-dj-eq', 32, 'span');
      this.document.body.appendChild(ambient);
      this.ambientEl = ambient;
      return;
    }

    switch (theme.id) {
      case 'wedding-spring':
        createNodes('anim-blossoms', 24, 'i');
        break;
      case 'wedding-autumn':
        // Fallback discret pour l'automne quand il n'y a pas de .autumn-leaves (ex: DJ)
        createNodes('anim-sparkles', 20, 'span');
        break;
      case 'seasonal-winter':
        createNodes('anim-snow', 28, 'i');
        break;
      case 'birthday-fun':
        createNodes('anim-confetti', 30, 'span');
        break;
      case 'corporate-luxury':
      case 'birthday-elegant':
        createNodes('anim-sparkles', 26, 'span');
        break;
      case 'party-neon':
        createNodes('anim-neon', 22, 'span');
        break;
      case 'corporate-modern':
      case 'party-retro':
        createNodes('anim-geometric', 22, 'span');
        break;
      case 'seasonal-summer':
        createNodes('anim-bubbles', 24, 'span');
        break;
      // Nouveaux thèmes modernes
      case 'modern-gradient':
        createNodes('anim-modern-particles', 25, 'span');
        break;
      case 'cyberpunk-glow':
        createNodes('anim-cyber-glitch', 30, 'span');
        break;
      case 'nature-zen':
        createNodes('anim-nature-leaves', 20, 'i');
        break;
      case 'sunset-dreams':
        createNodes('anim-sunset-rays', 22, 'span');
        break;
      case 'ocean-depths':
        createNodes('anim-ocean-waves', 18, 'span');
        break;
      case 'cosmic-nebula':
        createNodes('anim-cosmic-dust', 35, 'span');
        break;
      default:
        // Fallback discret
        createNodes('anim-stars', 18, 'i');
        break;
    }

    // Insérer juste après <body> pour qu'elle couvre tout l'écran des features joueurs
    this.document.body.appendChild(ambient);
    this.ambientEl = ambient;
  }

  // Obtient le thème actuel
  getCurrentTheme(): ThemeConfig | null {
    return this.currentThemeSubject.value;
  }

  // Génère les styles CSS pour un composant
  getComponentStyles(theme?: ThemeConfig): { [key: string]: string } {
    const currentTheme = theme || this.getCurrentTheme() || this.defaultTheme;

    return {
      'background-color': currentTheme.colors.background,
      color: currentTheme.colors.text,
      'font-family': currentTheme.fonts.primary,
      '--primary': currentTheme.colors.primary,
      '--secondary': currentTheme.colors.secondary,
      '--accent': currentTheme.colors.accent,
      '--surface': currentTheme.colors.surface,
      '--border': currentTheme.colors.border,
    };
  }

  // Obtient une couleur spécifique du thème actuel
  getColor(colorName: keyof ThemeColors): string {
    const theme = this.getCurrentTheme();
    return theme?.colors[colorName] || this.defaultTheme.colors[colorName] || '';
  }

  // Vérifie si le thème actuel est sombre
  isDarkTheme(): boolean {
    const backgroundColor = this.getColor('background');
    // Conversion hex/rgb to luminance (simplified)
    return (
      backgroundColor.toLowerCase().includes('#') &&
      parseInt(backgroundColor.replace('#', ''), 16) < 8388608
    ); // Roughly middle luminance
  }

  // Reset vers le thème par défaut
  resetToDefault() {
    this.applyTheme(this.defaultTheme);
  }

  // Obtient tous les thèmes prédéfinis
  getAllThemes(): ThemeConfig[] {
    return PREDEFINED_THEMES;
  }

  // Obtient les thèmes par catégorie
  getThemesByCategory(category: ThemeConfig['category']): ThemeConfig[] {
    return getThemesByCategory(category);
  }

  // Obtient un thème par ID
  getThemeById(themeId: string): ThemeConfig | undefined {
    return getThemeById(themeId);
  }

  // Obtient toutes les catégories disponibles
  getCategories(): ThemeConfig['category'][] {
    const categories = new Set(PREDEFINED_THEMES.map(theme => theme.category));
    return Array.from(categories);
  }

  // Crée un thème personnalisé basé sur des couleurs
  createCustomTheme(
    name: string,
    primaryColor: string,
    secondaryColor: string,
    backgroundColor: string = '#FFFFFF',
  ): ThemeConfig {
    return {
      id: 'custom-' + Date.now(),
      name: name,
      description: 'Thème personnalisé',
      category: 'custom',
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: secondaryColor,
        background: backgroundColor,
        surface: '#FFFFFF',
        text: backgroundColor === '#FFFFFF' ? '#2D3748' : '#FFFFFF',
        textSecondary: backgroundColor === '#FFFFFF' ? '#718096' : '#CBD5E0',
        border: backgroundColor === '#FFFFFF' ? '#E2E8F0' : '#4A5568',
        gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      },
      fonts: {
        primary: "'Inter', sans-serif",
        heading: "'Inter', sans-serif",
      },
    };
  }
}
