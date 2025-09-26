import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { requireStaff, requireRole } from "../../middlewares/auth";
import {
  PREDEFINED_THEMES,
  getThemeById,
  getThemesByCategory,
  DEFAULT_THEME,
  ThemeConfig,
} from "../../types/themes";

const router = Router();

// Interface pour les paramètres d'événement
export interface EventSettings {
  // Paramètres de jeu
  defaultSongDuration?: number;
  defaultSongsPerRound?: number;

  // Leaderboard
  leaderboardLiveGlobal?: boolean;
  leaderboardOnProjectorDuringTimer?: boolean;

  // Équipes
  minTeamSize?: number;
  maxTeamSize?: number;

  // Matching/Scoring
  titleSimilarityThreshold?: number;
  artistSimilarityThreshold?: number;

  // Purge et maintenance
  dataPurgeDays?: number;

  // Thème et branding
  themeId?: string; // ID du thème prédéfini
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    logoUrl?: string;
  };
  customTheme?: ThemeConfig; // Thème personnalisé complet

  // Paramètres avancés
  enableWebsockets?: boolean;
  enableHTTPFallback?: boolean;
  maxAnswerLength?: number;
  enableAliases?: boolean;
}

// Valeurs par défaut
const DEFAULT_SETTINGS: EventSettings = {
  defaultSongDuration: 15,
  defaultSongsPerRound: 20,
  leaderboardLiveGlobal: true,
  leaderboardOnProjectorDuringTimer: false,
  minTeamSize: 1,
  maxTeamSize: undefined,
  titleSimilarityThreshold: 0.7,
  artistSimilarityThreshold: 0.7,
  dataPurgeDays: 7,
  themeId: DEFAULT_THEME.id, // Utilise le thème par défaut
  theme: {
    primaryColor: DEFAULT_THEME.colors.primary,
    secondaryColor: DEFAULT_THEME.colors.secondary,
    backgroundColor: DEFAULT_THEME.colors.background,
    fontFamily: DEFAULT_THEME.fonts.primary,
    logoUrl: undefined,
  },
  enableWebsockets: true,
  enableHTTPFallback: true,
  maxAnswerLength: 255,
  enableAliases: true,
};

// GET /api/events/:code/settings - Récupérer les paramètres
router.get("/events/:code/settings", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    const event = await eventRepo.findOne({ where: { code: req.params.code } });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    let settings = DEFAULT_SETTINGS;
    if (event.settings_json) {
      try {
        const savedSettings = JSON.parse(event.settings_json);
        settings = { ...DEFAULT_SETTINGS, ...savedSettings };
      } catch (error) {
        console.warn("Invalid settings JSON for event", event.id, error);
      }
    }

    return res.json({
      eventCode: event.code,
      eventName: event.name,
      settings,
      lastUpdated: event.created_at,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// PUT /api/events/:code/settings - Mettre à jour les paramètres (Admin uniquement)
router.put(
  "/events/:code/settings",
  requireStaff,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({
          error: {
            code: "INVALID_SETTINGS",
            message: "Settings object required",
          },
        });
      }

      const eventRepo = AppDataSource.getRepository(Event);
      const event = await eventRepo.findOne({
        where: { code: req.params.code },
      });

      if (!event) {
        return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
      }

      // Validation des paramètres
      const validationErrors = validateSettings(settings);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid settings",
            details: validationErrors,
          },
        });
      }

      // Merge avec les paramètres existants
      let currentSettings = DEFAULT_SETTINGS;
      if (event.settings_json) {
        try {
          currentSettings = {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(event.settings_json),
          };
        } catch (error) {
          console.warn("Invalid existing settings JSON, using defaults");
        }
      }

      const updatedSettings = { ...currentSettings, ...settings };

      // Deep merge pour le thème
      if (settings.theme && currentSettings.theme) {
        updatedSettings.theme = { ...currentSettings.theme, ...settings.theme };
      }

      event.settings_json = JSON.stringify(updatedSettings);
      const saved = await eventRepo.save(event);

      return res.json({
        eventCode: saved.code,
        settings: updatedSettings,
        updated: true,
        message: "Settings updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: { code: "SERVER_ERROR", message: String(error) },
      });
    }
  },
);

// GET /api/events/:code/settings/schema - Récupérer le schéma des paramètres
router.get("/events/:code/settings/schema", (req, res) => {
  const schema = {
    gameSettings: {
      defaultSongDuration: {
        type: "number",
        min: 5,
        max: 120,
        default: 15,
        description: "Durée par défaut d'une chanson en secondes",
      },
      defaultSongsPerRound: {
        type: "number",
        min: 1,
        max: 100,
        default: 20,
        description: "Nombre de chansons par défaut par round",
      },
    },
    display: {
      leaderboardLiveGlobal: {
        type: "boolean",
        default: true,
        description: "Affichage du leaderboard en temps réel (global)",
      },
      leaderboardOnProjectorDuringTimer: {
        type: "boolean",
        default: false,
        description: "Affichage du leaderboard sur projecteur pendant le timer",
      },
    },
    teams: {
      minTeamSize: {
        type: "number",
        min: 1,
        max: 50,
        default: 1,
        description: "Taille minimale des équipes",
      },
      maxTeamSize: {
        type: "number",
        min: 1,
        max: 50,
        default: null,
        description: "Taille maximale des équipes (null = illimité)",
      },
    },
    matching: {
      titleSimilarityThreshold: {
        type: "number",
        min: 0.1,
        max: 1.0,
        default: 0.7,
        description:
          "Seuil de similarité pour les titres (0.1 = très permissif, 1.0 = exact)",
      },
      artistSimilarityThreshold: {
        type: "number",
        min: 0.1,
        max: 1.0,
        default: 0.7,
        description: "Seuil de similarité pour les artistes",
      },
    },
    maintenance: {
      dataPurgeDays: {
        type: "number",
        min: 1,
        max: 365,
        default: 7,
        description: "Nombre de jours avant purge automatique des données",
      },
    },
    theme: {
      primaryColor: {
        type: "string",
        pattern: "^#[0-9A-Fa-f]{6}$",
        default: "#8B4513",
        description: "Couleur primaire (hex)",
      },
      secondaryColor: {
        type: "string",
        pattern: "^#[0-9A-Fa-f]{6}$",
        default: "#DAA520",
        description: "Couleur secondaire (hex)",
      },
      backgroundColor: {
        type: "string",
        pattern: "^#[0-9A-Fa-f]{6}$",
        default: "#FDF5E6",
        description: "Couleur de fond (hex)",
      },
      fontFamily: {
        type: "string",
        default: "'Inter', sans-serif",
        description: "Police de caractères",
      },
      logoUrl: {
        type: "string",
        default: null,
        description: "URL du logo personnalisé",
      },
    },
  };

  return res.json({
    schema,
    defaults: DEFAULT_SETTINGS,
  });
});

function validateSettings(settings: any): string[] {
  const errors: string[] = [];

  // Validation des nombres
  if (settings.defaultSongDuration !== undefined) {
    if (
      typeof settings.defaultSongDuration !== "number" ||
      settings.defaultSongDuration < 5 ||
      settings.defaultSongDuration > 120
    ) {
      errors.push("defaultSongDuration must be between 5 and 120 seconds");
    }
  }

  if (settings.defaultSongsPerRound !== undefined) {
    if (
      typeof settings.defaultSongsPerRound !== "number" ||
      settings.defaultSongsPerRound < 1 ||
      settings.defaultSongsPerRound > 100
    ) {
      errors.push("defaultSongsPerRound must be between 1 and 100");
    }
  }

  if (settings.minTeamSize !== undefined) {
    if (typeof settings.minTeamSize !== "number" || settings.minTeamSize < 1) {
      errors.push("minTeamSize must be at least 1");
    }
  }

  if (settings.maxTeamSize !== undefined && settings.maxTeamSize !== null) {
    if (typeof settings.maxTeamSize !== "number" || settings.maxTeamSize < 1) {
      errors.push("maxTeamSize must be at least 1 or null");
    }
  }

  // Validation des seuils de similarité
  if (settings.titleSimilarityThreshold !== undefined) {
    if (
      typeof settings.titleSimilarityThreshold !== "number" ||
      settings.titleSimilarityThreshold < 0.1 ||
      settings.titleSimilarityThreshold > 1.0
    ) {
      errors.push("titleSimilarityThreshold must be between 0.1 and 1.0");
    }
  }

  if (settings.artistSimilarityThreshold !== undefined) {
    if (
      typeof settings.artistSimilarityThreshold !== "number" ||
      settings.artistSimilarityThreshold < 0.1 ||
      settings.artistSimilarityThreshold > 1.0
    ) {
      errors.push("artistSimilarityThreshold must be between 0.1 and 1.0");
    }
  }

  // Validation du thème ID
  if (settings.themeId !== undefined) {
    const { PREDEFINED_THEMES } = require("../../types/themes");
    const validThemeIds = PREDEFINED_THEMES.map((theme: any) => theme.id);
    if (
      typeof settings.themeId !== "string" ||
      !validThemeIds.includes(settings.themeId)
    ) {
      errors.push(`themeId must be one of: ${validThemeIds.join(", ")}`);
    }
  }

  // Validation des couleurs
  if (settings.theme) {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    if (
      settings.theme.primaryColor &&
      !hexColorRegex.test(settings.theme.primaryColor)
    ) {
      errors.push("theme.primaryColor must be a valid hex color (#RRGGBB)");
    }

    if (
      settings.theme.secondaryColor &&
      !hexColorRegex.test(settings.theme.secondaryColor)
    ) {
      errors.push("theme.secondaryColor must be a valid hex color (#RRGGBB)");
    }

    if (
      settings.theme.backgroundColor &&
      !hexColorRegex.test(settings.theme.backgroundColor)
    ) {
      errors.push("theme.backgroundColor must be a valid hex color (#RRGGBB)");
    }
  }

  // Validation de la purge
  if (settings.dataPurgeDays !== undefined) {
    if (
      typeof settings.dataPurgeDays !== "number" ||
      settings.dataPurgeDays < 1 ||
      settings.dataPurgeDays > 365
    ) {
      errors.push("dataPurgeDays must be between 1 and 365");
    }
  }

  return errors;
}

// GET /api/themes - Récupérer tous les thèmes disponibles
router.get("/themes", (req, res) => {
  try {
    const { category } = req.query;

    let themes = PREDEFINED_THEMES;
    if (category && typeof category === "string") {
      themes = getThemesByCategory(category as ThemeConfig["category"]);
    }

    const themesWithPreview = themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      category: theme.category,
      preview: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        background: theme.colors.background,
        gradient: theme.colors.gradient,
      },
    }));

    return res.json({
      themes: themesWithPreview,
      categories: [
        "wedding",
        "corporate",
        "birthday",
        "party",
        "seasonal",
        "custom",
      ],
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/themes/:themeId - Récupérer un thème complet par ID
router.get("/themes/:themeId", (req, res) => {
  try {
    const { themeId } = req.params;
    const theme = getThemeById(themeId);

    if (!theme) {
      return res.status(404).json({
        error: { code: "THEME_NOT_FOUND", message: "Theme not found" },
      });
    }

    return res.json(theme);
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/events/:code/theme - Récupérer le thème appliqué à un événement
router.get("/events/:code/theme", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);
    const event = await eventRepo.findOne({ where: { code: req.params.code } });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Parse raw settings (as saved) and also prepare a merged view for convenience
    let rawSettings: any = undefined;
    let settings = DEFAULT_SETTINGS;
    if (event.settings_json) {
      try {
        rawSettings = JSON.parse(event.settings_json);
        settings = { ...DEFAULT_SETTINGS, ...rawSettings };
      } catch (error) {
        console.warn("Invalid settings JSON for event", event.id, error);
      }
    }

    // Si un thème prédéfini est spécifié, l'utiliser
    let appliedTheme = DEFAULT_THEME;
    if (settings.themeId) {
      const predefinedTheme = getThemeById(settings.themeId);
      if (predefinedTheme) {
        appliedTheme = predefinedTheme;
      }
    }

    // Si un thème personnalisé existe, l'utiliser (prioritaire)
    if (settings.customTheme) {
      appliedTheme = settings.customTheme;
    }

    // Appliquer les surcharges individuelles UNIQUEMENT si elles ont été définies explicitement
    // Ne pas utiliser les valeurs par défaut (issues de DEFAULT_SETTINGS) comme overrides
    const explicitThemeOverrides = rawSettings?.theme;
    if (explicitThemeOverrides && typeof explicitThemeOverrides === "object") {
      const { primaryColor, secondaryColor, backgroundColor, fontFamily } =
        explicitThemeOverrides;
      const hasAnyOverride =
        primaryColor !== undefined ||
        secondaryColor !== undefined ||
        backgroundColor !== undefined ||
        fontFamily !== undefined;

      if (hasAnyOverride) {
        appliedTheme = {
          ...appliedTheme,
          colors: {
            ...appliedTheme.colors,
            ...(primaryColor ? { primary: primaryColor } : {}),
            ...(secondaryColor ? { secondary: secondaryColor } : {}),
            ...(backgroundColor ? { background: backgroundColor } : {}),
          },
          fonts: {
            ...appliedTheme.fonts,
            ...(fontFamily ? { primary: fontFamily } : {}),
          },
        };
      }
    }

    return res.json({
      eventCode: event.code,
      eventName: event.name,
      theme: appliedTheme,
      themeSource: settings.customTheme
        ? "custom"
        : settings.themeId
          ? "predefined"
          : "default",
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// PUT /api/events/:code/theme - Appliquer un thème à un événement
router.put(
  "/events/:code/theme",
  requireStaff,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { themeId, customTheme, overrides } = req.body;

      if (!themeId && !customTheme) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message: "Either themeId or customTheme is required",
          },
        });
      }

      const eventRepo = AppDataSource.getRepository(Event);
      const event = await eventRepo.findOne({
        where: { code: req.params.code },
      });

      if (!event) {
        return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
      }

      // Validation du thème prédéfini si spécifié
      if (themeId && !getThemeById(themeId)) {
        return res.status(400).json({
          error: { code: "INVALID_THEME", message: "Theme not found" },
        });
      }

      // Récupérer les paramètres existants
      let currentSettings = DEFAULT_SETTINGS;
      if (event.settings_json) {
        try {
          currentSettings = {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(event.settings_json),
          };
        } catch (error) {
          console.warn("Invalid existing settings JSON, using defaults");
        }
      }

      // Mettre à jour les paramètres de thème
      const updatedSettings = {
        ...currentSettings,
        themeId: themeId || currentSettings.themeId,
        customTheme: customTheme || currentSettings.customTheme,
        theme: overrides
          ? { ...currentSettings.theme, ...overrides }
          : currentSettings.theme,
      };

      event.settings_json = JSON.stringify(updatedSettings);
      const saved = await eventRepo.save(event);

      return res.json({
        eventCode: saved.code,
        themeApplied: themeId || "custom",
        updated: true,
        message: "Theme updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: { code: "SERVER_ERROR", message: String(error) },
      });
    }
  },
);

export default router;
