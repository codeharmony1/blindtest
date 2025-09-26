import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Organizer } from "../../db/entities/Organizer";
import { Round } from "../../db/entities/Round";
import { Team } from "../../db/entities/Team";

const router = Router();

// GET /api/events (get all events for an organizer)
router.get("/events", async (req, res) => {
  try {
    const { organizerId } = req.query;
    if (!organizerId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "organizerId query parameter required",
        },
      });
    }

    const eventRepo = AppDataSource.getRepository(Event);
    const events = await eventRepo.find({
      where: { organizer: { id: String(organizerId) } },
      relations: ["organizer"],
      order: { created_at: "DESC" },
    });

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
      created_at: event.created_at,
      status: "active", // TODO: implement real status logic
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

// POST /api/events  (simple: organizerId fourni dans le body)
router.post("/events", async (req, res) => {
  try {
    const { organizerId, name, code, settings } = req.body ?? {};
    if (!organizerId || !name)
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "organizerId & name required",
        },
      });

    const orgRepo = AppDataSource.getRepository(Organizer);
    const organizer = await orgRepo.findOne({
      where: { id: String(organizerId) },
    });
    if (!organizer)
      return res.status(404).json({ error: { code: "ORGANIZER_NOT_FOUND" } });

    const event = new Event();
    event.organizer = organizer;
    event.name = name;
    event.code = code ?? generateCode();
    event.settings_json = settings ? JSON.stringify(settings) : undefined;

    const saved = await AppDataSource.getRepository(Event).save(event);
    return res.status(201).json({
      id: saved.id,
      code: saved.code,
      name: saved.name,
      createdAt: saved.created_at,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { code: "SERVER_ERROR", message: String(e) } });
  }
});

// GET /api/events/id/:id (get event info by ID)
router.get("/events/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Event);
    const event = await repo.findOne({ where: { id } });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
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
router.put("/events/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, settings } = req.body ?? {};

    const repo = AppDataSource.getRepository(Event);
    const event = await repo.findOne({ where: { id: String(id) } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
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
      createdAt: event.created_at,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/events/id/:id/rounds - list rounds for an event (admin usage)
router.get("/events/id/:id/rounds", async (req, res) => {
  try {
    const { id } = req.params;
    const eventRepo = AppDataSource.getRepository(Event);
    const roundRepo = AppDataSource.getRepository(Round);

    const event = await eventRepo.findOne({ where: { id: String(id) } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
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
    settings: {
      defaultSongDuration: settings?.defaultSongDuration ?? 15,
      defaultSongsPerRound: settings?.defaultSongsPerRound ?? 20,
    },
  });
});

// GET /api/dashboard/stats (get dashboard statistics)
router.get("/dashboard/stats", async (req, res) => {
  try {
    const eventRepo = AppDataSource.getRepository(Event);

    // Import des autres entités nécessaires
    const { Round } = await import("../../db/entities/Round");
    const { RoundSong } = await import("../../db/entities/RoundSong");
    const { Team } = await import("../../db/entities/Team");

    const roundRepo = AppDataSource.getRepository(Round);
    const songRepo = AppDataSource.getRepository(RoundSong);
    const teamRepo = AppDataSource.getRepository(Team);

    const [totalEvents, totalRounds, totalSongs, totalTeams] =
      await Promise.all([
        eventRepo.count(),
        roundRepo.count(),
        songRepo.count(),
        teamRepo.count(),
      ]);

    // Pour l'instant, considérons tous les événements comme actifs
    // TODO: Implémenter une vraie logique de statut
    const activeEvents = totalEvents;

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

export default router;
