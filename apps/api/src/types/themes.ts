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
      primary: '#B8860B',
      secondary: '#CD853F',
      accent: '#FF8C00',
      background: '#FFF8DC',
      surface: '#FFFEF7',
      text: '#8B4513',
      textSecondary: '#A0522D',
      border: '#DEB887',
      gradient: 'linear-gradient(135deg, #B8860B 0%, #CD853F 30%, #FF8C00 70%, #DAA520 100%)'
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
      primary: '#32CD32',
      secondary: '#FF69B4',
      accent: '#98FB98',
      background: '#F0FFF0',
      surface: '#FFFFFF',
      text: '#2F4F2F',
      textSecondary: '#556B2F',
      border: '#90EE90',
      gradient: 'radial-gradient(ellipse at top, #F0FFF0 0%, #98FB98 25%, #FFB6C1 50%, #32CD32 100%)'
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
      primary: '#3B82F6',
      secondary: '#6366F1',
      accent: '#06B6D4',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#475569',
      border: '#E2E8F0',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 25%, #8B5CF6 50%, #06B6D4 100%)'
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
      secondary: '#F59E0B',
      accent: '#EAB308',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#374151',
      border: '#D1D5DB',
      gradient: 'linear-gradient(145deg, #1F2937 0%, #374151 20%, #F59E0B 60%, #EAB308 100%)'
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
      primary: '#FF4757',
      secondary: '#3742FA',
      accent: '#FFA502',
      background: '#FFF9E6',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      border: '#F1C40F',
      gradient: 'conic-gradient(from 0deg, #FF4757, #FFA502, #3742FA, #FF6B9D, #FF4757)'
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
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#2D3748',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
      gradient: 'radial-gradient(circle at 30% 40%, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #F59E0B 100%)'
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
      secondary: '#00D9FF',
      accent: '#FFD700',
      background: '#FFF8DC',
      surface: '#FFFFFF',
      text: '#2F4858',
      textSecondary: '#5A6B73',
      border: '#90D4F7',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #FFD700 30%, #00D9FF 70%, #06FFA5 100%)'
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
      primary: '#1E40AF',
      secondary: '#F3F4F6',
      accent: '#EF4444',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#D1D5DB',
      gradient: 'radial-gradient(ellipse at bottom, #1E40AF 0%, #3B82F6 30%, #F3F4F6 70%, #EF4444 100%)'
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
      accent: '#39FF14',
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      border: '#FF0080',
      gradient: 'conic-gradient(from 90deg, #FF0080, #00FFFF, #39FF14, #FF6B00, #8A2BE2, #FF0080)'
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
      primary: '#FF1744',
      secondary: '#E91E63',
      accent: '#FF9800',
      background: '#FFF3E0',
      surface: '#FFFFFF',
      text: '#4A148C',
      textSecondary: '#7B1FA2',
      border: '#F8BBD9',
      gradient: 'linear-gradient(45deg, #FF1744 0%, #E91E63 20%, #9C27B0 40%, #673AB7 60%, #3F51B5 80%, #FF9800 100%)'
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
  },

  // === NOUVEAUX THÈMES MODERNES ===
  {
    id: 'modern-gradient',
    name: 'Moderne Dégradé',
    description: 'Design contemporain avec dégradés sophistiqués',
    category: 'corporate',
    colors: {
      primary: '#667EEA',
      secondary: '#764BA2',
      accent: '#F093FB',
      background: '#FDFBFB',
      surface: '#FFFFFF',
      text: '#2D3748',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 25%, #F093FB 50%, #F5576C 75%, #4FACFE 100%)'
    },
    fonts: {
      primary: "'Inter', sans-serif",
      heading: "'Outfit', sans-serif"
    },
    imagery: {
      backgroundPattern: 'geometric-modern',
      iconStyle: 'filled',
      illustrations: ['modern-abstract', 'geometric-shapes']
    },
    animations: {
      duration: 'fast',
      easing: 'ease-out'
    }
  },
  {
    id: 'cyberpunk-glow',
    name: 'Cyberpunk Futuriste',
    description: 'Thème futuriste avec effets lumineux',
    category: 'party',
    colors: {
      primary: '#00D4FF',
      secondary: '#FF006E',
      accent: '#8338EC',
      background: '#0D1117',
      surface: '#161B22',
      text: '#F0F6FC',
      textSecondary: '#7D8590',
      border: '#30363D',
      gradient: 'linear-gradient(135deg, #00D4FF 0%, #FF006E 25%, #8338EC 50%, #3A86FF 75%, #06FFA5 100%)'
    },
    fonts: {
      primary: "'JetBrains Mono', monospace",
      heading: "'Orbitron', monospace"
    },
    imagery: {
      backgroundPattern: 'circuit-board',
      iconStyle: 'filled',
      illustrations: ['neon-grid', 'hologram', 'digital-wave']
    },
    animations: {
      duration: 'fast',
      easing: 'ease-in-out'
    }
  },
  {
    id: 'nature-zen',
    name: 'Nature Zen',
    description: 'Sérénité et harmonie naturelle',
    category: 'seasonal',
    colors: {
      primary: '#2ECC71',
      secondary: '#3498DB',
      accent: '#F39C12',
      background: '#F8FDF8',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      border: '#BDC3C7',
      gradient: 'radial-gradient(ellipse at center, #F8FDF8 0%, #A8E6CF 30%, #88D8A3 60%, #2ECC71 100%)'
    },
    fonts: {
      primary: "'Nunito', sans-serif",
      heading: "'Comfortaa', cursive"
    },
    imagery: {
      backgroundPattern: 'organic-leaves',
      iconStyle: 'outline',
      illustrations: ['tree', 'mountains', 'water-drop']
    },
    animations: {
      duration: 'slow',
      easing: 'ease-in-out'
    }
  },
  {
    id: 'sunset-dreams',
    name: 'Rêves de Coucher de Soleil',
    description: 'Couleurs chaudes du coucher de soleil',
    category: 'wedding',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFD93D',
      background: '#FFF9F0',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      border: '#F39C12',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 20%, #FF6B9D 40%, #C44569 60%, #F8B500 80%, #4ECDC4 100%)'
    },
    fonts: {
      primary: "'Poppins', sans-serif",
      heading: "'Satisfy', cursive"
    },
    imagery: {
      backgroundPattern: 'sunset-clouds',
      iconStyle: 'duotone',
      illustrations: ['sunset', 'clouds', 'birds']
    },
    animations: {
      duration: 'normal',
      easing: 'ease-out'
    }
  },
  {
    id: 'ocean-depths',
    name: 'Profondeurs Océaniques',
    description: 'Mystère et profondeur des océans',
    category: 'seasonal',
    colors: {
      primary: '#0077BE',
      secondary: '#00B4D8',
      accent: '#90E0EF',
      background: '#F0F8FF',
      surface: '#FFFFFF',
      text: '#003049',
      textSecondary: '#006494',
      border: '#0077BE',
      gradient: 'radial-gradient(ellipse at top, #F0F8FF 0%, #CAF0F8 20%, #90E0EF 40%, #00B4D8 60%, #0077BE 80%, #003566 100%)'
    },
    fonts: {
      primary: "'Source Sans Pro', sans-serif",
      heading: "'Raleway', sans-serif"
    },
    imagery: {
      backgroundPattern: 'wave-pattern',
      iconStyle: 'filled',
      illustrations: ['waves', 'fish', 'coral']
    },
    animations: {
      duration: 'slow',
      easing: 'ease-in-out'
    }
  },
  {
    id: 'cosmic-nebula',
    name: 'Nébuleuse Cosmique',
    description: 'Mystères de l\'espace et des galaxies',
    category: 'party',
    colors: {
      primary: '#8B5A96',
      secondary: '#6A4C93',
      accent: '#F72585',
      background: '#0F0F23',
      surface: '#1A1A2E',
      text: '#EEEEFF',
      textSecondary: '#A6A6D4',
      border: '#4C4C6D',
      gradient: 'radial-gradient(ellipse at center, #0F0F23 0%, #16213E 20%, #8B5A96 40%, #6A4C93 60%, #F72585 80%, #4895EF 100%)'
    },
    fonts: {
      primary: "'Space Mono', monospace",
      heading: "'Exo 2', sans-serif"
    },
    imagery: {
      backgroundPattern: 'star-field',
      iconStyle: 'filled',
      illustrations: ['stars', 'galaxy', 'planet']
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