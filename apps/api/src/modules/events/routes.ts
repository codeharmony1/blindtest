import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Organizer } from "../../db/entities/Organizer";
import { Round } from "../../db/entities/Round";
import { Team } from "../../db/entities/Team";
import { Tenant } from "../../db/entities/Tenant";
import { env } from "../../config/env";
import { requireStaff, AuthedStaff } from "../../middlewares/auth";
import { tenantIsolationMiddleware } from "../../middlewares/tenant-isolation";
import { generateSecurePIN, hashPIN } from "../../services/pin.service";
import {
  generateUniqueEventCode,
  calculateCodeExpiration,
  canReactivateWithCode,
} from "../../services/event-code.service";

const router = Router();

// GET /api/events (get all events for current tenant)
router.get("/events", requireStaff, async (req: AuthedStaff, res) => {
  try {
    // Dans le système multi-tenant, on filtre par tenant_id du token
    // Si c'est l'ancien système, on utilise organizerId
    const tenantContext = (req as any).tenant;

    const eventRepo = AppDataSource.getRepository(Event);
    let events: Event[];

    if (tenantContext?.tenantId) {
      // Nouveau système multi-tenant : filtrer par tenant_id
      events = await eventRepo.find({
        where: { tenant_id: tenantContext.tenantId },
        order: { created_at: "DESC" },
      });
    } else if (req.staff?.organizerId) {
      // Ancien système legacy : utiliser l'organizerId du token (pas du query param)
      events = await eventRepo.find({
        where: { organizer: { id: String(req.staff.organizerId) } },
        relations: ["organizer"],
        order: { created_at: "DESC" },
      });
    } else {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // If no events, return early
    if (events.length === 0) {
      return res.json({ events: [] });
    }

    // Build counts for rounds and teams per event in a single query each
    const eventIds = events.map((e) => e.id);

    const roundCountsRaw = await AppDataSource.getRepository(Round)
      .createQueryBuilder("r")
      .select("r.event_id", "event_id")
      .addSelect("COUNT(*)", "count")
      .where("r.event_id IN (:...ids)", { ids: eventIds })
      .groupBy("r.event_id")
      .getRawMany();

    const teamCountsRaw = await AppDataSource.getRepository(Team)
      .createQueryBuilder("t")
      .select("t.event_id", "event_id")
      .addSelect("COUNT(*)", "count")
      .where("t.event_id IN (:...ids)", { ids: eventIds })
      .groupBy("t.event_id")
      .getRawMany();

    const roundCounts = new Map<string, number>(
      roundCountsRaw.map((r: any) => [String(r.event_id), Number(r.count)]),
    );
    const teamCounts = new Map<string, number>(
      teamCountsRaw.map((t: any) => [String(t.event_id), Number(t.count)]),
    );

    const formattedEvents = events.map((event) => ({
      id: event.id,
      code: event.code,
      name: event.name,
      gameMode: event.game_mode,
      created_at: event.created_at,
      status: event.status || "ACTIVE",
      rounds_count: roundCounts.get(String(event.id)) ?? 0,
      teams_count: teamCounts.get(String(event.id)) ?? 0,
    }));

    return res.json({ events: formattedEvents });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// POST /api/events (create event for current tenant)
router.post("/events", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { name, code, settings, gameMode, tableMode, startDate, endDate } =
      req.body ?? {};
    const tenantContext = (req as any).tenant;

    console.log("[DEBUG] POST /api/events - Request context:", {
      hasTenantContext: !!tenantContext,
      tenantId: tenantContext?.tenantId,
      userId: tenantContext?.userId,
      hasStaff: !!req.staff,
      organizerId: req.staff?.organizerId,
      body: {
        name,
        code,
        gameMode,
        tableMode,
        startDate,
        endDate,
        hasSettings: !!settings,
      },
    });

    if (!name) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "name required",
        },
      });
    }

    // Valider les dates si fournies
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid startDate format",
          },
        });
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid endDate format",
          },
        });
      }
    }

    // Valider que endDate > startDate si les deux sont fournis
    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "endDate must be after startDate",
        },
      });
    }

    // Valider gameMode si fourni
    if (gameMode && !["TEAM", "SOLO"].includes(gameMode)) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "gameMode must be TEAM or SOLO",
        },
      });
    }

    const eventRepo = AppDataSource.getRepository(Event);

    if (tenantContext?.tenantId) {
      // Nouveau système multi-tenant
      const tenantRepo = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepo.findOne({
        where: { id: tenantContext.tenantId },
      });

      if (!tenant) {
        return res.status(404).json({ error: { code: "TENANT_NOT_FOUND" } });
      }

      // Générer un code unique basé sur le lifecycle
      const uniqueCode = code
        ? code
        : await generateUniqueEventCode({
            eventRepo,
            tenantId: tenant.id,
            preferredCode: code,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            codeLength: 8,
          });

      // Calculer la date d'expiration du code
      const codeExpiresAt = calculateCodeExpiration(
        parsedStartDate,
        parsedEndDate
      );

      // Générer un PIN DJ lors de la création
      const djPin = generateSecurePIN();
      const djPinHash = await hashPIN(djPin);

      const event = new Event();
      event.name = name;
      event.code = uniqueCode;
      event.game_mode = gameMode ?? "TEAM";
      event.table_mode = tableMode ?? false;
      event.settings_json = settings ? JSON.stringify(settings) : undefined;
      event.dj_pin_hash = djPinHash;
      event.tenant = tenant;
      event.tenant_id = tenant.id;
      event.start_date = parsedStartDate;
      event.end_date = parsedEndDate;
      event.code_expires_at = codeExpiresAt;

      const saved = await eventRepo.save(event);

      // Créer automatiquement une entrée EventStaff pour le créateur
      if (tenantContext.userId) {
        try {
          const staffRepo = AppDataSource.getRepository(
            (await import("../../db/entities/EventStaff")).EventStaff,
          );
          console.log("[DEBUG] Creating EventStaff entry:", {
            event_id: saved.id,
            tenant_user_id: tenantContext.userId,
            role: "ADMIN"
          });
          await staffRepo.insert({
            event_id: saved.id,
            tenant_user_id: tenantContext.userId,
            role: "ADMIN",
          } as any);
          console.log("[DEBUG] EventStaff entry created successfully");
        } catch (staffError: any) {
          console.error("[ERROR] Failed to create EventStaff entry:", {
            error: staffError,
            message: staffError.message,
            code: staffError.code
          });
          // Ne pas faire échouer toute la création d'événement si EventStaff échoue
          // L'événement est déjà créé
        }
      }

      return res.status(201).json({
        id: saved.id,
        code: saved.code,
        name: saved.name,
        gameMode: saved.game_mode,
        tableMode: saved.table_mode,
        startDate: saved.start_date,
        endDate: saved.end_date,
        codeExpiresAt: saved.code_expires_at,
        createdAt: saved.created_at,
        djPin: djPin, // ⚠️ PIN en clair retourné UNE SEULE FOIS
      });
    } else if (req.staff?.organizerId) {
      // Ancien système legacy - utiliser l'organizerId du token directement
      const orgRepo = AppDataSource.getRepository(Organizer);
      const organizer = await orgRepo.findOne({
        where: { id: String(req.staff.organizerId) },
      });
      if (!organizer)
        return res
          .status(404)
          .json({ error: { code: "ORGANIZER_NOT_FOUND" } });

      // Ensure default tenant exists (multi-tenant compatibility during transition)
      const tenantRepo = AppDataSource.getRepository(Tenant);
      const DEFAULT_TENANT_ID =
        (env as any).DEFAULT_TENANT_ID ??
        "00000000-0000-0000-0000-000000000001";
      let tenant = await tenantRepo.findOne({
        where: { id: DEFAULT_TENANT_ID },
      });
      if (!tenant) {
        await tenantRepo.insert({
          id: DEFAULT_TENANT_ID,
          name: "Default Tenant",
          slug: "default",
          subscription_plan: "ENTERPRISE",
          subscription_status: "ACTIVE",
          billing_email:
            process.env.SUPER_ADMIN_EMAIL || "admin@blindtest.local",
          max_concurrent_events: 999,
          max_players_per_event: 999,
          is_active: true,
        } as any);
        tenant = await tenantRepo.findOne({ where: { id: DEFAULT_TENANT_ID } });
      }

      // Générer un code unique basé sur le lifecycle
      const uniqueCode = code
        ? code
        : await generateUniqueEventCode({
            eventRepo,
            tenantId: DEFAULT_TENANT_ID,
            preferredCode: code,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            codeLength: 8,
          });

      const codeExpiresAt = calculateCodeExpiration(
        parsedStartDate,
        parsedEndDate
      );

      // Générer un PIN DJ lors de la création
      const djPin = generateSecurePIN();
      const djPinHash = await hashPIN(djPin);

      const event = new Event();
      event.organizer = organizer;
      event.name = name;
      event.code = uniqueCode;
      event.game_mode = gameMode ?? "TEAM";
      event.table_mode = tableMode ?? false;
      event.settings_json = settings ? JSON.stringify(settings) : undefined;
      event.dj_pin_hash = djPinHash;
      event.start_date = parsedStartDate;
      event.end_date = parsedEndDate;
      event.code_expires_at = codeExpiresAt;
      // Assign tenant relation (and id) to satisfy FK constraint
      if (tenant) {
        (event as any).tenant = tenant;
        (event as any).tenant_id = tenant.id;
      }

      const saved = await eventRepo.save(event);
      return res.status(201).json({
        id: saved.id,
        code: saved.code,
        name: saved.name,
        gameMode: saved.game_mode,
        tableMode: saved.table_mode,
        startDate: saved.start_date,
        endDate: saved.end_date,
        codeExpiresAt: saved.code_expires_at,
        createdAt: saved.created_at,
        djPin: djPin, // ⚠️ PIN en clair retourné UNE SEULE FOIS
      });
    } else {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }
  } catch (e: any) {
    console.error("[ERROR] Event creation failed:", {
      error: e,
      message: e.message,
      stack: e.stack,
      code: e.code,
      query: e.query
    });
    return res
      .status(500)
      .json({
        error: {
          code: "SERVER_ERROR",
          message: String(e),
          details: e.message
        }
      });
  }
});

// GET /api/events/id/:id (get event info by ID)
router.get("/events/id/:id", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Event);
    const event = await repo.findOne({
      where: { id },
      relations: ["organizer"]
    });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Vérifier que l'organisateur de l'événement est bien l'utilisateur authentifié
    if (event.organizer?.id !== req.staff!.organizerId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own events",
        },
      });
    }

    return res.json({
      id: event.id,
      code: event.code,
      name: event.name,
      createdAt: event.created_at,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// PUT /api/events/id/:id (update basic event info and settings)
router.put("/events/id/:id", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { id } = req.params;
    const { name, settings } = req.body ?? {};

    const repo = AppDataSource.getRepository(Event);
    const event = await repo.findOne({
      where: { id: String(id) },
      relations: ["organizer"]
    });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Vérifier que l'utilisateur authentifié modifie bien SON PROPRE événement
    if (event.organizer?.id !== req.staff!.organizerId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own events",
        },
      });
    }

    // Update allowed fields
    if (typeof name === "string" && name.trim().length >= 3) {
      event.name = name.trim();
    }

    if (settings && typeof settings === "object") {
      // Merge with existing settings if present
      let current: any = {};
      if (event.settings_json) {
        try {
          current = JSON.parse(event.settings_json);
        } catch {}
      }
      const merged = { ...current, ...settings };
      event.settings_json = JSON.stringify(merged);
    }

    const saved = await repo.save(event);
    return res.json({
      id: saved.id,
      code: saved.code,
      name: saved.name,
      createdAt: saved.created_at,
      updated: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/events/:code (get event info)
router.get("/events/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const repo = AppDataSource.getRepository(Event);
    const event = await repo.findOne({ where: { code } });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    return res.json({
      id: event.id,
      code: event.code,
      name: event.name,
      gameMode: event.game_mode,
      createdAt: event.created_at,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/events/id/:id/rounds - list rounds for an event (admin usage)
router.get("/events/id/:id/rounds", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { id } = req.params;
    const eventRepo = AppDataSource.getRepository(Event);
    const roundRepo = AppDataSource.getRepository(Round);

    const event = await eventRepo.findOne({
      where: { id: String(id) },
      relations: ["organizer"]
    });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Vérifier que l'utilisateur authentifié accède bien à SON PROPRE événement
    if (event.organizer?.id !== req.staff!.organizerId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view rounds for your own events",
        },
      });
    }

    const rounds = await roundRepo.find({
      where: { event_id: event.id },
      order: { created_at: "ASC" },
    });

    return res.json({
      event: { id: event.id, code: event.code, name: event.name },
      rounds: rounds.map((r) => ({
        id: r.id,
        name: r.name,
        default_duration_s: r.default_duration_s,
        total_songs: r.total_songs,
        created_at: r.created_at,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/events/:code/public
router.get("/events/:code/public", async (req, res) => {
  const code = req.params.code;
  const repo = AppDataSource.getRepository(Event);
  const ev = await repo.findOne({ where: { code } });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
  let settings: any = {};
  try {
    settings = ev.settings_json ? JSON.parse(ev.settings_json) : {};
  } catch {}
  return res.json({
    code: ev.code,
    name: ev.name,
    gameMode: ev.game_mode,
    tableMode: ev.table_mode,
    settings: {
      defaultSongDuration: settings?.defaultSongDuration ?? 15,
      defaultSongsPerRound: settings?.defaultSongsPerRound ?? 20,
      tableMode: ev.table_mode,
    },
  });
});

// GET /api/dashboard/stats (get dashboard statistics for current organization)
router.get("/dashboard/stats", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const tenantContext = (req as any).tenant;
    const eventRepo = AppDataSource.getRepository(Event);

    // Import des autres entités nécessaires
    const { Round } = await import("../../db/entities/Round");
    const { RoundSong } = await import("../../db/entities/RoundSong");

    const roundRepo = AppDataSource.getRepository(Round);
    const songRepo = AppDataSource.getRepository(RoundSong);
    const teamRepo = AppDataSource.getRepository(Team);

    // Déterminer le filtre selon le contexte (multi-tenant ou legacy)
    let eventFilter: any;
    if (tenantContext?.tenantId) {
      // Nouveau système multi-tenant : filtrer par tenant_id
      eventFilter = { tenant_id: tenantContext.tenantId };
    } else if (req.staff?.organizerId) {
      // Ancien système legacy : filtrer par organizer
      eventFilter = { organizer: { id: String(req.staff.organizerId) } };
    } else {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    // Récupérer les événements de l'organisation
    const events = await eventRepo.find({
      where: eventFilter
    });
    const eventIds = events.map(e => e.id);

    const totalEvents = events.length;
    // Compter les événements actifs (status = 'ACTIVE')
    const activeEvents = events.filter(e => e.status === 'ACTIVE').length;

    // Compter les statistiques uniquement pour les événements de cette organisation
    let totalRounds = 0;
    let totalSongs = 0;
    let totalTeams = 0;

    if (eventIds.length > 0) {
      // Utiliser createQueryBuilder pour les requêtes IN
      totalRounds = await roundRepo.createQueryBuilder('r')
        .where('r.event_id IN (:...eventIds)', { eventIds })
        .getCount();

      totalTeams = await teamRepo.createQueryBuilder('t')
        .where('t.event_id IN (:...eventIds)', { eventIds })
        .getCount();

      // Pour compter les chansons, récupérer d'abord les rounds
      if (totalRounds > 0) {
        const rounds = await roundRepo.createQueryBuilder('r')
          .select('r.id')
          .where('r.event_id IN (:...eventIds)', { eventIds })
          .getMany();
        const roundIds = rounds.map(r => r.id);

        if (roundIds.length > 0) {
          totalSongs = await songRepo.createQueryBuilder('s')
            .where('s.round_id IN (:...roundIds)', { roundIds })
            .getCount();
        }
      }
    }

    return res.json({
      totalEvents,
      activeEvents,
      totalRounds,
      totalSongs,
      totalTeams,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

function generateCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

// POST /api/events/:code/complete - Marquer un événement comme terminé
router.post("/events/:code/complete", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { code } = req.params;
    const { completeEvent } = await import("./complete-event");

    const success = await completeEvent(code);

    if (!success) {
      return res.status(404).json({
        error: { code: "EVENT_NOT_FOUND", message: "Event not found" },
      });
    }

    return res.json({
      success: true,
      message: `Event ${code} marked as completed`,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// POST /api/events/:id/duplicate - Duplicate an event with all its rounds and songs
router.post("/events/:id/duplicate", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantContext = (req as any).tenant;

    const eventRepo = AppDataSource.getRepository(Event);
    const roundRepo = AppDataSource.getRepository(Round);
    const { RoundSong } = await import("../../db/entities/RoundSong");
    const songRepo = AppDataSource.getRepository(RoundSong);

    // Find the original event
    const originalEvent = await eventRepo.findOne({
      where: { id: String(id) },
      relations: ["organizer", "tenant"],
    });

    if (!originalEvent) {
      return res.status(404).json({
        error: { code: "EVENT_NOT_FOUND", message: "Event not found" },
      });
    }

    // Verify ownership (multi-tenant or legacy)
    if (tenantContext?.tenantId) {
      if (originalEvent.tenant_id !== tenantContext.tenantId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You can only duplicate your own events",
          },
        });
      }
    } else if (req.staff?.organizerId) {
      if (originalEvent.organizer?.id !== req.staff.organizerId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You can only duplicate your own events",
          },
        });
      }
    }

    // Create the duplicated event with a new code
    const newEvent = new Event();
    newEvent.name = name || `${originalEvent.name} (Copie)`;
    newEvent.code = generateCode();
    newEvent.game_mode = originalEvent.game_mode;
    newEvent.settings_json = originalEvent.settings_json;
    newEvent.status = "DRAFT"; // New events start as draft
    newEvent.tenant_id = originalEvent.tenant_id;
    newEvent.tenant = originalEvent.tenant;

    // Preserve legacy organizer if exists
    if (originalEvent.organizer) {
      newEvent.organizer = originalEvent.organizer;
    }

    const savedEvent = await eventRepo.save(newEvent);

    // Find all rounds from the original event
    const originalRounds = await roundRepo.find({
      where: { event_id: originalEvent.id },
      order: { created_at: "ASC" },
    });

    // Duplicate each round and its songs
    for (const originalRound of originalRounds) {
      const newRound = new Round();
      newRound.event_id = savedEvent.id;
      newRound.tenant_id = savedEvent.tenant_id;
      newRound.name = originalRound.name;
      newRound.default_duration_s = originalRound.default_duration_s;
      newRound.total_songs = originalRound.total_songs;

      const savedRound = await roundRepo.save(newRound);

      // Find all songs from the original round
      const originalSongs = await songRepo.find({
        where: { round_id: originalRound.id },
        order: { idx: "ASC" },
      });

      // Duplicate each song
      for (const originalSong of originalSongs) {
        const newSong = new (RoundSong as any)();
        newSong.round_id = savedRound.id;
        newSong.tenant_id = savedEvent.tenant_id;
        newSong.idx = originalSong.idx;
        newSong.mode = originalSong.mode;
        newSong.title_official = originalSong.title_official;
        newSong.artist_official = originalSong.artist_official;
        newSong.aliases_json = originalSong.aliases_json;
        newSong.duration_s = originalSong.duration_s;
        newSong.status = "pending"; // Reset status for new songs

        await songRepo.save(newSong);
      }
    }

    // Create EventStaff entry for multi-tenant system
    if (tenantContext?.userId) {
      try {
        const staffRepo = AppDataSource.getRepository(
          (await import("../../db/entities/EventStaff")).EventStaff,
        );
        await staffRepo.insert({
          event_id: savedEvent.id,
          tenant_user_id: tenantContext.userId,
          role: "ADMIN",
        } as any);
      } catch (staffError) {
        console.error("[ERROR] Failed to create EventStaff entry during duplication:", staffError);
        // Ne pas faire échouer toute la duplication si EventStaff échoue
      }
    }

    return res.status(201).json({
      id: savedEvent.id,
      code: savedEvent.code,
      name: savedEvent.name,
      gameMode: savedEvent.game_mode,
      createdAt: savedEvent.created_at,
      originalEventId: originalEvent.id,
      roundsCount: originalRounds.length,
    });
  } catch (error) {
    console.error("Error duplicating event:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// POST /api/events/:id/reactivate - Réactiver un événement avec nouvelles dates
router.post(
  "/events/:id/reactivate",
  requireStaff,
  async (req: AuthedStaff, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.body;
      const tenantContext = (req as any).tenant;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "startDate and endDate are required",
          },
        });
      }

      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (
        isNaN(parsedStartDate.getTime()) ||
        isNaN(parsedEndDate.getTime())
      ) {
        return res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Invalid date format" },
        });
      }

      if (parsedEndDate <= parsedStartDate) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "endDate must be after startDate",
          },
        });
      }

      const eventRepo = AppDataSource.getRepository(Event);
      const event = await eventRepo.findOne({
        where: { id: String(id) },
        relations: ["tenant"],
      });

      if (!event) {
        return res
          .status(404)
          .json({ error: { code: "EVENT_NOT_FOUND" } });
      }

      // Vérifier l'isolation tenant
      if (tenantContext?.tenantId) {
        if (event.tenant_id !== tenantContext.tenantId) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "You can only reactivate your own events",
            },
          });
        }
      }

      // Tenter de réutiliser l'ancien code
      const reactivationCheck = await canReactivateWithCode(
        eventRepo,
        event,
        parsedStartDate,
        parsedEndDate
      );

      let finalCode = event.code;
      let codeChanged = false;

      if (!reactivationCheck.canReuse) {
        // L'ancien code est déjà pris, générer un nouveau
        finalCode = await generateUniqueEventCode({
          eventRepo,
          tenantId: event.tenant_id,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          codeLength: 8,
        });
        codeChanged = true;
        console.warn(
          `⚠️ Code changé lors de la réactivation: ${event.code} → ${finalCode} (${reactivationCheck.reason})`
        );
      }

      // Mettre à jour l'événement
      event.code = finalCode;
      event.start_date = parsedStartDate;
      event.end_date = parsedEndDate;
      event.code_expires_at = calculateCodeExpiration(
        parsedStartDate,
        parsedEndDate
      );
      event.status = "ACTIVE";
      event.completed_at = null; // Réinitialiser la date de complétion

      const saved = await eventRepo.save(event);

      return res.json({
        id: saved.id,
        code: saved.code,
        name: saved.name,
        startDate: saved.start_date,
        endDate: saved.end_date,
        codeExpiresAt: saved.code_expires_at,
        status: saved.status,
        codeChanged: codeChanged,
        previousCode: codeChanged ? event.code : undefined,
        message: codeChanged
          ? `Événement réactivé avec un nouveau code (${finalCode})`
          : `Événement réactivé avec le même code (${finalCode})`,
      });
    } catch (error) {
      console.error("[ERROR] Event reactivation failed:", error);
      return res.status(500).json({
        error: { code: "SERVER_ERROR", message: String(error) },
      });
    }
  }
);

// POST /api/events/:eventId/regenerate-dj-pin - Régénérer le PIN DJ
router.post("/events/:eventId/regenerate-dj-pin", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { eventId } = req.params;
    const tenantContext = (req as any).tenant;

    const eventRepo = AppDataSource.getRepository(Event);

    // Récupérer l'événement avec vérification tenant
    const event = await eventRepo.findOne({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: { code: "EVENT_NOT_FOUND" }
      });
    }

    // Vérifier l'isolation tenant (multi-tenant)
    if (tenantContext?.tenantId && event.tenant_id !== tenantContext.tenantId) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Access denied" }
      });
    }

    // Générer un nouveau PIN
    const newPin = generateSecurePIN();
    const newPinHash = await hashPIN(newPin);

    // Mettre à jour l'événement
    event.dj_pin_hash = newPinHash;
    await eventRepo.save(event);

    return res.json({
      success: true,
      message: "DJ PIN regenerated successfully",
      djPin: newPin, // ⚠️ PIN en clair retourné UNE SEULE FOIS
      eventCode: event.code,
      eventName: event.name
    });
  } catch (error) {
    console.error("[EVENTS] Regenerate DJ PIN error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete("/events/:id", requireStaff, async (req: AuthedStaff, res) => {
  try {
    const { id } = req.params;
    const tenantContext = (req as any).tenant;

    const eventRepo = AppDataSource.getRepository(Event);

    // Récupérer l'événement
    const event = await eventRepo.findOne({
      where: { id },
      relations: ["organizer"],
    });

    if (!event) {
      return res.status(404).json({
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      });
    }

    // Vérifier que l'utilisateur a le droit de supprimer cet événement
    if (tenantContext?.tenantId) {
      // Nouveau système multi-tenant : vérifier que l'événement appartient au tenant
      if (event.tenant_id !== tenantContext.tenantId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to delete this event",
          },
        });
      }
    } else if (req.staff?.organizerId) {
      // Ancien système legacy : vérifier que l'événement appartient à l'organisateur
      if (!event.organizer || event.organizer.id !== String(req.staff.organizerId)) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to delete this event",
          },
        });
      }
    } else {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Supprimer l'événement (les entités liées seront supprimées en cascade grâce aux relations TypeORM)
    await eventRepo.remove(event);

    return res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("[EVENTS] Delete event error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

export default router;
