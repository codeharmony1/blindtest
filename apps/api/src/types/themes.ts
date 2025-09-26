// Types pour le système de thèmes
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  gradient?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  category: 'wedding' | 'corporate' | 'birthday' | 'party' | 'seasonal' | 'custom';
  colors: ThemeColors;
  fonts: {
    primary: string;
    heading: string;
  };
  imagery?: {
    backgroundPattern?: string;
    iconStyle?: 'outline' | 'filled' | 'duotone';
    illustrations?: string[];
  };
  animations?: {
    duration: 'fast' | 'normal' | 'slow';
    easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}

// Thèmes prédéfinis
export const PREDEFINED_THEMES: ThemeConfig[] = [
  // === THÈMES MARIAGE ===
  {
    id: 'wedding-autumn',
    name: 'Mariage Automne',
    description: 'Couleurs chaudes et romantiques pour un mariage automnal',
    category: 'wedding',
    colors: {
      primary: '#8B4513',
      secondary: '#DAA520',
      accent: '#D2691E',
      background: '#FDF5E6',
      surface: '#FFFFFF',
      text: '#2F1B14',
      textSecondary: '#6B4423',
      border: '#DEB887',
      gradient: 'linear-gradient(135deg, #8B4513 0%, #DAA520 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Playfair Display', serif"
    },
    imagery: {
      backgroundPattern: 'autumn-leaves',
      iconStyle: 'outline',
      illustrations: ['rings', 'flowers', 'hearts']
    },
    animations: {
      duration: 'normal',
      easing: 'ease-in-out'
    }
  },
  {
    id: 'wedding-spring',
    name: 'Mariage Printemps',
    description: 'Fraîcheur et élégance pour un mariage printanier',
    category: 'wedding',
    colors: {
      primary: '#228B22',
      secondary: '#FFB6C1',
      accent: '#98FB98',
      background: '#F0FFF0',
      surface: '#FFFFFF',
      text: '#2F4F2F',
      textSecondary: '#556B2F',
      border: '#90EE90',
      gradient: 'linear-gradient(135deg, #228B22 0%, #FFB6C1 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Dancing Script', cursive"
    },
    imagery: {
      backgroundPattern: 'cherry-blossoms',
      iconStyle: 'outline',
      illustrations: ['flowers', 'butterflies', 'birds']
    },
    animations: {
      duration: 'normal',
      easing: 'ease-out'
    }
  },

  // === THÈMES CORPORATE ===
  {
    id: 'corporate-modern',
    name: 'Entreprise Moderne',
    description: 'Design professionnel et contemporain',
    category: 'corporate',
    colors: {
      primary: '#2563EB',
      secondary: '#64748B',
      accent: '#0EA5E9',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#475569',
      border: '#E2E8F0',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Roboto', sans-serif"
    },
    imagery: {
      backgroundPattern: 'geometric',
      iconStyle: 'filled',
      illustrations: ['charts', 'handshake', 'trophy']
    },
    animations: {
      duration: 'fast',
      easing: 'ease-in-out'
    }
  },
  {
    id: 'corporate-luxury',
    name: 'Entreprise Prestige',
    description: 'Élégance et sophistication pour les événements haut de gamme',
    category: 'corporate',
    colors: {
      primary: '#1F2937',
      secondary: '#D4AF37',
      accent: '#F59E0B',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#374151',
      border: '#D1D5DB',
      gradient: 'linear-gradient(135deg, #1F2937 0%, #D4AF37 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Merriweather', serif"
    },
    imagery: {
      backgroundPattern: 'subtle-dots',
      iconStyle: 'outline',
      illustrations: ['crown', 'diamond', 'award']
    },
    animations: {
      duration: 'slow',
      easing: 'ease-in-out'
    }
  },

  // === THÈMES ANNIVERSAIRE ===
  {
    id: 'birthday-fun',
    name: 'Anniversaire Festif',
    description: 'Couleurs vives et joyeuses pour une fête d\'anniversaire',
    category: 'birthday',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFF9E6',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      border: '#F1C40F',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #FFE66D 100%)'
    },
    fonts: {
      primary: "'Nunito', sans-serif",
      heading: "'Fredoka One', cursive"
    },
    imagery: {
      backgroundPattern: 'confetti',
      iconStyle: 'filled',
      illustrations: ['balloons', 'cake', 'gifts', 'party-hat']
    },
    animations: {
      duration: 'fast',
      easing: 'ease-out'
    }
  },
  {
    id: 'birthday-elegant',
    name: 'Anniversaire Élégant',
    description: 'Sophistication pour un anniversaire adulte',
    category: 'birthday',
    colors: {
      primary: '#6C63FF',
      secondary: '#FF6B9D',
      accent: '#FFC107',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#2D3748',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
      gradient: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Poppins', sans-serif"
    },
    imagery: {
      backgroundPattern: 'stars',
      iconStyle: 'duotone',
      illustrations: ['champagne', 'celebration', 'fireworks']
    },
    animations: {
      duration: 'normal',
      easing: 'ease-in-out'
    }
  },

  // === THÈMES SAISONNIERS ===
  {
    id: 'seasonal-summer',
    name: 'Été Tropical',
    description: 'Ambiance estivale et tropicale',
    category: 'seasonal',
    colors: {
      primary: '#FF6B35',
      secondary: '#00B4D8',
      accent: '#FFBE0B',
      background: '#FFF8DC',
      surface: '#FFFFFF',
      text: '#2F4858',
      textSecondary: '#5A6B73',
      border: '#90D4F7',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #00B4D8 100%)'
    },
    fonts: {
      primary: "'Nunito', sans-serif",
      heading: "'Pacifico', cursive"
    },
    imagery: {
      backgroundPattern: 'waves',
      iconStyle: 'filled',
      illustrations: ['palm-tree', 'sun', 'beach', 'cocktail']
    },
    animations: {
      duration: 'normal',
      easing: 'ease-out'
    }
  },
  {
    id: 'seasonal-winter',
    name: 'Hiver Cosy',
    description: 'Chaleur et convivialité hivernale',
    category: 'seasonal',
    colors: {
      primary: '#1E3A8A',
      secondary: '#E5E7EB',
      accent: '#DC2626',
      background: '#F3F4F6',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#D1D5DB',
      gradient: 'linear-gradient(135deg, #1E3A8A 0%, #DC2626 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Merriweather', serif"
    },
    imagery: {
      backgroundPattern: 'snowflakes',
      iconStyle: 'outline',
      illustrations: ['snowflake', 'fireplace', 'hot-chocolate']
    },
    animations: {
      duration: 'slow',
      easing: 'ease-in-out'
    }
  },

  // === THÈMES PARTY ===
  {
    id: 'party-neon',
    name: 'Soirée Néon',
    description: 'Ambiance électrique et moderne',
    category: 'party',
    colors: {
      primary: '#FF0080',
      secondary: '#00FFFF',
      accent: '#FFFF00',
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      border: '#FF0080',
      gradient: 'linear-gradient(135deg, #FF0080 0%, #00FFFF 50%, #FFFF00 100%)'
    },
    fonts: {
      primary: "'Orbitron', monospace",
      heading: "'Exo 2', sans-serif"
    },
    imagery: {
      backgroundPattern: 'neon-grid',
      iconStyle: 'filled',
      illustrations: ['disco-ball', 'neon-sign', 'dj-turntable']
    },
    animations: {
      duration: 'fast',
      easing: 'ease-out'
    }
  },
  {
    id: 'party-retro',
    name: 'Rétro Vintage',
    description: 'Nostalgie des années 80-90',
    category: 'party',
    colors: {
      primary: '#E91E63',
      secondary: '#9C27B0',
      accent: '#FF9800',
      background: '#FFF3E0',
      surface: '#FFFFFF',
      text: '#4A148C',
      textSecondary: '#7B1FA2',
      border: '#F8BBD9',
      gradient: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)'
    },
    fonts: {
      primary: "'Press Start 2P', cursive",
      heading: "'Righteous', cursive"
    },
    imagery: {
      backgroundPattern: 'retro-squares',
      iconStyle: 'filled',
      illustrations: ['cassette', 'boombox', 'vinyl-record']
    },
    animations: {
      duration: 'normal',
      easing: 'ease-in-out'
    }
  }
];

// Fonction utilitaire pour récupérer un thème par ID
export function getThemeById(themeId: string): ThemeConfig | undefined {
  return PREDEFINED_THEMES.find(theme => theme.id === themeId);
}

// Fonction pour récupérer les thèmes par catégorie
export function getThemesByCategory(category: ThemeConfig['category']): ThemeConfig[] {
  return PREDEFINED_THEMES.filter(theme => theme.category === category);
}

// Thème par défaut (Mariage Automne)
export const DEFAULT_THEME = PREDEFINED_THEMES[0];