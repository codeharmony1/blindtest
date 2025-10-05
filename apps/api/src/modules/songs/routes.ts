// apps/api/src/modules/songs/routes.ts
import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Round } from "../../db/entities/Round";
import { RoundSong } from "../../db/entities/RoundSong";
import { Answer } from "../../db/entities/Answer";
import { Score } from "../../db/entities/Score";
import { Team } from "../../db/entities/Team";
import { Event } from "../../db/entities/Event";
import { Tenant } from "../../db/entities/Tenant";
import { matchingService } from "../../services/matching.service";
import { computePoints } from "../../services/scoring.service";
import { io } from "../../ws/socket";

const router = Router();

/* ----------------------------------------------------------------
   CRUD minimal pour créer/éditer des chansons (déjà fourni)
------------------------------------------------------------------*/

// POST /api/rounds/:roundId/songs  (prepared or freestyle)
router.post("/rounds/:roundId/songs", async (req, res) => {
  const { mode, idx, title, artist, aliases, duration } = req.body ?? {};
  if (!mode || !idx)
    return res
      .status(400)
      .json({ error: { code: "BAD_REQUEST", message: "mode & idx required" } });

  const round = await AppDataSource.getRepository(Round).findOne({
    where: { id: String(req.params.roundId) },
    relations: ["event", "event.tenant"]
  });
  if (!round)
    return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });

  // Vérification des limites du plan DEMO
  const event = round.event as Event;
  if (event && event.tenant_id) {
    const tenant = await AppDataSource.getRepository(Tenant).findOne({
      where: { id: event.tenant_id }
    });

    if (tenant && tenant.subscription_plan === 'DEMO' && tenant.max_songs_per_event) {
      // Compter le nombre de chansons déjà existantes pour cet événement
      const existingSongsCount = await AppDataSource.getRepository(RoundSong)
        .createQueryBuilder("song")
        .innerJoin("song.round", "round")
        .where("round.event_id = :eventId", { eventId: event.id })
        .getCount();

      if (existingSongsCount >= tenant.max_songs_per_event) {
        return res.status(403).json({
          error: {
            code: "SONG_LIMIT_REACHED",
            message: `Plan DEMO limité à ${tenant.max_songs_per_event} chansons par événement. Passez à un plan payant pour ajouter plus de chansons.`,
            limit: tenant.max_songs_per_event,
            current: existingSongsCount
          }
        });
      }
    }
  }

  const rs = new RoundSong();
  rs.round = round;
  rs.round_id = round.id;
  rs.idx = idx;
  rs.mode = mode === "freestyle" ? "freestyle" : "prepared";
  rs.title_official = title ?? null;
  rs.artist_official = artist ?? null;
  rs.aliases_json = aliases?.length ? JSON.stringify(aliases) : undefined;
  rs.duration_s = duration ?? null; // si null => défaut du round
  rs.status = "pending";

  const saved = await AppDataSource.getRepository(RoundSong).save(rs);
  return res
    .status(201)
    .json({ id: saved.id, idx: saved.idx, mode: saved.mode });
});

// PATCH /api/songs/:songId  (MAJ titre/artiste/aliases, utile en freestyle)
router.patch("/songs/:songId", async (req, res) => {
  const { title, artist, aliases, duration, status } = req.body ?? {};
  const repo = AppDataSource.getRepository(RoundSong);
  const song = await repo.findOne({ where: { id: String(req.params.songId) } });
  if (!song) return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });

  if (title !== undefined) song.title_official = title;
  if (artist !== undefined) song.artist_official = artist;
  if (aliases !== undefined)
    song.aliases_json = Array.isArray(aliases)
      ? JSON.stringify(aliases)
      : undefined;
  if (duration !== undefined) song.duration_s = duration;
  if (status !== undefined) {
    if (["pending", "open", "closed", "scored"].includes(status)) {
      song.status = status;
      if (status === "open" && !song.started_at) {
        song.started_at = new Date();
      }
    }
  }

  const saved = await repo.save(song);
  return res.json({
    id: saved.id,
    title: saved.title_official,
    artist: saved.artist_official,
    status: saved.status,
  });
});

/* ----------------------------------------------------------------
   LIVE controls
   - open:    ouvre la fenêtre de 15s (ou durée paramétrée)
   - close:   ferme (force ended_at = now)
   - grade:   recalcule points selon titre/artiste officiels
------------------------------------------------------------------*/

function nowUtc(): Date {
  return new Date();
}

async function getEventContextFromSong(songId: string) {
  const song = await AppDataSource.getRepository(RoundSong).findOne({
    where: { id: String(songId) },
    relations: ["round", "round.event"],
  });
  if (!song)
    return {
      song: null,
      eventCode: null,
      eventId: null,
      roundId: null,
      round: null as Round | null,
    };
  const eventCode = (song.round as any).event?.code as string | undefined;
  const eventId = (song.round as any).event?.id as string | undefined;
  return {
    song,
    eventCode: eventCode ?? null,
    eventId: eventId ?? null,
    roundId: song.round_id,
    round: song.round,
  };
}

function computeDurationSeconds(
  song: RoundSong,
  round: Round,
  override?: number,
): number {
  return Number(override ?? song.duration_s ?? round.default_duration_s ?? 15);
}

async function buildLeaderboard(eventId: string) {
  const scoreRepo = AppDataSource.getRepository(Score);
  const teamRepo = AppDataSource.getRepository(Team);
  const [scores, teams] = await Promise.all([
    scoreRepo.find({ where: { event_id: eventId } }),
    teamRepo.find({ where: { event_id: eventId } }),
  ]);
  const merged = scores
    .map((s) => ({
      teamId: s.team_id,
      name: teams.find((t) => t.id === s.team_id)?.name ?? "???",
      totalPoints: s.total_points,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((x, i) => ({ ...x, rank: i + 1 }));
  return merged;
}

// POST /api/songs/:songId/open
router.post("/songs/:songId/open", async (req, res) => {
  const { duration } = req.body ?? {};
  const ctx = await getEventContextFromSong(req.params.songId);
  if (!ctx.song)
    return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });
  if (!ctx.round)
    return res
      .status(409)
      .json({ error: { code: "CONFLICT_STATE", message: "Round missing" } });

  if (ctx.song.status !== "pending") {
    return res.status(409).json({
      error: {
        code: "CONFLICT_STATE",
        message: `Song status is ${ctx.song.status}`,
      },
    });
  }

  const dur = computeDurationSeconds(ctx.song, ctx.round, duration);
  const startedAt = nowUtc();
  const endsAt = new Date(startedAt.getTime() + dur * 1000);

  ctx.song.status = "open";
  ctx.song.started_at = startedAt;
  ctx.song.ended_at = endsAt;
  await AppDataSource.getRepository(RoundSong).save(ctx.song);

  if (ctx.eventCode) {
    io.to(`event:${ctx.eventCode}`).emit("round_started", {
      roundId: ctx.roundId,
      songId: ctx.song.id,
      duration: dur,
      endsAt: endsAt.toISOString(),
    });
  }

  return res.json({
    songId: ctx.song.id,
    status: "open",
    duration: dur,
    endsAt: endsAt.toISOString(),
  });
});

// POST /api/songs/:songId/close
router.post("/songs/:songId/close", async (req, res) => {
  const ctx = await getEventContextFromSong(req.params.songId);
  if (!ctx.song)
    return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });

  if (ctx.song.status === "open") {
    ctx.song.status = "closed";
    ctx.song.ended_at = nowUtc();
    await AppDataSource.getRepository(RoundSong).save(ctx.song);

    if (ctx.eventCode) {
      io.to(`event:${ctx.eventCode}`).emit("round_ended", {
        roundId: ctx.roundId,
        songId: ctx.song.id,
      });
    }
    return res.json({ songId: ctx.song.id, status: "closed" });
  } else if (ctx.song.status === "closed" || ctx.song.status === "scored") {
    return res.json({ songId: ctx.song.id, status: ctx.song.status });
  } else {
    return res.status(409).json({
      error: {
        code: "CONFLICT_STATE",
        message: `Song status is ${ctx.song.status}`,
      },
    });
  }
});

// GET /api/songs/:songId/answers - Récupérer les réponses pour correction DJ
router.get("/songs/:songId/answers", async (req, res) => {
  try {
    const ctx = await getEventContextFromSong(req.params.songId);
    if (!ctx.song) {
      return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });
    }

    const ansRepo = AppDataSource.getRepository(Answer);
    const teamRepo = AppDataSource.getRepository(Team);

    const [answers, teams] = await Promise.all([
      ansRepo.find({
        where: { round_song_id: ctx.song.id },
        order: { submitted_at: "ASC" }
      }),
      teamRepo.find({ where: { event_id: ctx.eventId! } })
    ]);

    const results = answers.map(answer => {
      const team = teams.find(t => t.id === answer.team_id);
      return {
        teamId: answer.team_id,
        teamName: team?.name || "Unknown",
        textRaw: answer.text_raw,
        submittedAt: answer.submitted_at.toISOString(),
        matchTitle: answer.match_title,
        matchArtist: answer.match_artist,
        points: answer.points,
        canOverride: true // DJ peut toujours override
      };
    });

    return res.json({
      songId: ctx.song.id,
      songTitle: ctx.song.title_official,
      songArtist: ctx.song.artist_official,
      status: ctx.song.status,
      answers: results,
      totalAnswers: results.length
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/songs/:songId/answers/:teamId/override - Override une réponse
router.post("/songs/:songId/answers/:teamId/override", async (req, res) => {
  try {
    const { matchTitle, matchArtist, points } = req.body ?? {};

    if (typeof matchTitle !== "boolean" || typeof matchArtist !== "boolean") {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "matchTitle and matchArtist must be booleans" }
      });
    }

    const ansRepo = AppDataSource.getRepository(Answer);
    const answer = await ansRepo.findOne({
      where: {
        round_song_id: String(req.params.songId),
        team_id: String(req.params.teamId)
      }
    });

    if (!answer) {
      return res.status(404).json({ error: { code: "ANSWER_NOT_FOUND" } });
    }

    // Update avec les nouvelles valeurs
    answer.match_title = matchTitle;
    answer.match_artist = matchArtist;
    answer.points = typeof points === "number" ? points : computePoints(matchTitle, matchArtist);

    const saved = await ansRepo.save(answer);

    return res.json({
      teamId: saved.team_id,
      matchTitle: saved.match_title,
      matchArtist: saved.match_artist,
      points: saved.points,
      updated: true
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/songs/:songId/grade
router.post("/songs/:songId/grade", async (req, res) => {
  const { title, artist } = req.body ?? {};
  const ctx = await getEventContextFromSong(req.params.songId);
  if (!ctx.song)
    return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });

  // Option: mise à jour de la réponse officielle (freestyle)
  if (title !== undefined) ctx.song.title_official = title;
  if (artist !== undefined) ctx.song.artist_official = artist;

  // Si encore "open", on force la clôture à now
  if (ctx.song.status === "open") {
    ctx.song.status = "closed";
    ctx.song.ended_at = nowUtc();
  }

  await AppDataSource.getRepository(RoundSong).save(ctx.song);

  // Recalcul des réponses (points) pour ce morceau avec matching intelligent
  const ansRepo = AppDataSource.getRepository(Answer);
  const answers = await ansRepo.find({ where: { round_song_id: ctx.song.id } });

  const results: Array<{
    teamId: string;
    matchTitle: boolean;
    matchArtist: boolean;
    points: number;
    titleSimilarity?: number;
    artistSimilarity?: number;
  }> = [];

  for (const a of answers) {
    const matchResult = await matchingService.scoreAnswer(a.text_raw, ctx.song.id);

    a.match_title = matchResult.matchTitle;
    a.match_artist = matchResult.matchArtist;
    a.points = matchResult.points;
    a.text_norm = matchResult.normalizedAnswer;

    await ansRepo.save(a); // triggers SQL mettront à jour scores
    results.push({
      teamId: a.team_id,
      matchTitle: a.match_title,
      matchArtist: a.match_artist,
      points: a.points,
      titleSimilarity: matchResult.titleSimilarity,
      artistSimilarity: matchResult.artistSimilarity
    });
  }

  // Statut scored
  ctx.song.status = "scored";
  await AppDataSource.getRepository(RoundSong).save(ctx.song);

  // Leaderboard
  const leaderboard = ctx.eventId ? await buildLeaderboard(ctx.eventId) : [];

  // Broadcasts
  if (ctx.eventCode) {
    // réponse officielle -> écran de projection (et/ou global en pause)
    io.to(`display:${ctx.eventCode}`).emit("official_answer", {
      songId: ctx.song.id,
      title: ctx.song.title_official ?? "",
      artist: ctx.song.artist_official ?? "",
    });
    // leaderboard à tout l'événement
    io.to(`event:${ctx.eventCode}`).emit("leaderboard_update", {
      eventCode: ctx.eventCode,
      teams: leaderboard,
    });
  }

  return res.json({
    songId: ctx.song.id,
    status: "scored",
    results,
    leaderboard,
  });
});

// POST /api/songs/:songId/aliases - Ajouter/modifier des alias pour une chanson
router.post("/songs/:songId/aliases", async (req, res) => {
  try {
    const { aliases } = req.body ?? {};

    if (!Array.isArray(aliases)) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "aliases must be an array" }
      });
    }

    const songRepo = AppDataSource.getRepository(RoundSong);
    const song = await songRepo.findOne({ where: { id: String(req.params.songId) } });

    if (!song) {
      return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });
    }

    // Stocker les alias en JSON
    // Format: ["alias1", "alias2", "artist:Artist Alias"]
    song.aliases_json = JSON.stringify(aliases);
    const saved = await songRepo.save(song);

    return res.json({
      songId: saved.id,
      aliases: JSON.parse(saved.aliases_json || "[]"),
      updated: true
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// GET /api/songs/:songId/aliases - Récupérer les alias d'une chanson
router.get("/songs/:songId/aliases", async (req, res) => {
  try {
    const songRepo = AppDataSource.getRepository(RoundSong);
    const song = await songRepo.findOne({ where: { id: String(req.params.songId) } });

    if (!song) {
      return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });
    }

    const aliases = song.aliases_json ? JSON.parse(song.aliases_json) : [];

    return res.json({
      songId: song.id,
      title: song.title_official,
      artist: song.artist_official,
      aliases
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/songs/:songId/suggest-aliases - Suggérer des alias basés sur les réponses
router.post("/songs/:songId/suggest-aliases", async (req, res) => {
  try {
    const ctx = await getEventContextFromSong(req.params.songId);
    if (!ctx.song) {
      return res.status(404).json({ error: { code: "SONG_NOT_FOUND" } });
    }

    // Récupérer toutes les réponses pour cette chanson
    const ansRepo = AppDataSource.getRepository(Answer);
    const answers = await ansRepo.find({
      where: { round_song_id: ctx.song.id }
    });

    if (answers.length === 0) {
      return res.json({
        songId: ctx.song.id,
        suggestions: [],
        message: "No answers yet to analyze"
      });
    }

    const playerAnswers = answers.map(a => a.text_raw);
    const suggestions = matchingService.suggestAliases(
      playerAnswers,
      ctx.song.title_official || "",
      ctx.song.artist_official || ""
    );

    return res.json({
      songId: ctx.song.id,
      title: ctx.song.title_official,
      artist: ctx.song.artist_official,
      suggestions,
      totalAnswers: answers.length
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// DELETE /api/songs/:id - Supprimer une chanson
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const songRepo = AppDataSource.getRepository(RoundSong);

  try {
    const song = await songRepo.findOne({
      where: { id: String(id) },
      relations: ["round", "round.event"],
    });

    if (!song) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Song not found" }
      });
    }

    const eventCode = (song.round as any).event?.code as string | undefined;
    const roundId = song.round_id;

    await songRepo.delete({ id: String(id) });

    // Emit WebSocket event
    if (eventCode) {
      io.to(`event:${eventCode}`).emit("song_deleted", {
        songId: id,
        roundId: roundId,
      });
    }

    return res.json({
      message: "Song deleted successfully",
      songId: id,
      roundId: roundId
    });
  } catch (error) {
    console.error("Error deleting song:", error);
    return res.status(500).json({
      error: { code: "DELETE_ERROR", message: String(error) }
    });
  }
});

export default router;
