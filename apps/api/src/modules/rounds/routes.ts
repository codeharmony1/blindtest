// apps/api/src/modules/rounds/routes.ts
import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Round } from "../../db/entities/Round";
import { RoundSong } from "../../db/entities/RoundSong";
import { Answer } from "../../db/entities/Answer";
import { Score } from "../../db/entities/Score";
import { Team } from "../../db/entities/Team";
import { matchingService } from "../../services/matching.service";
import { computePoints } from "../../services/scoring.service";
import { io } from "../../ws/socket";

const router = Router();

function nowUtc(): Date {
  return new Date();
}

async function buildLeaderboard(eventId: string) {
  const scoreRepo = AppDataSource.getRepository(Score);
  const teamRepo = AppDataSource.getRepository(Team);
  const [scores, teams] = await Promise.all([
    scoreRepo.find({ where: { event_id: eventId } }),
    teamRepo.find({ where: { event_id: eventId } }),
  ]);
  return scores
    .map((s) => ({
      teamId: s.team_id,
      name: teams.find((t) => t.id === s.team_id)?.name ?? "???",
      totalPoints: s.total_points,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((x, i) => ({ ...x, rank: i + 1 }));
}

async function gradeSongInternal(
  song: RoundSong,
  eventCode: string | null,
  eventId: string | null,
) {
  // Fermer si encore open
  if (song.status === "open") {
    song.status = "closed";
    song.ended_at = nowUtc();
    await AppDataSource.getRepository(RoundSong).save(song);
    if (eventCode) {
      io.to(`event:${eventCode}`).emit("round_ended", {
        roundId: song.round_id,
        songId: song.id,
      });
    }
  }

  // Recalcule points selon titre/artiste officiels avec matching intelligent
  const ansRepo = AppDataSource.getRepository(Answer);
  const answers = await ansRepo.find({ where: { round_song_id: song.id } });

  for (const a of answers) {
    const matchResult = await matchingService.scoreAnswer(a.text_raw, song.id);
    a.match_title = matchResult.matchTitle;
    a.match_artist = matchResult.matchArtist;
    a.points = matchResult.points;
    a.text_norm = matchResult.normalizedAnswer;
    await ansRepo.save(a);
  }
  song.status = "scored";
  await AppDataSource.getRepository(RoundSong).save(song);

  // Diffusions
  if (eventCode) {
    io.to(`display:${eventCode}`).emit("official_answer", {
      songId: song.id,
      title: song.title_official ?? "",
      artist: song.artist_official ?? "",
    });
  }
  const leaderboard = eventId ? await buildLeaderboard(eventId) : [];
  if (eventCode) {
    io.to(`event:${eventCode}`).emit("leaderboard_update", {
      eventCode,
      teams: leaderboard,
    });
  }
  return leaderboard;
}

// POST /api/events/:code/rounds
router.post("/events/:code/rounds", async (req, res) => {
  const { name, defaultDuration, totalSongs } = req.body ?? {};
  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

  const r = new Round();
  r.event = ev;
  r.event_id = ev.id;
  r.name = name ?? null;
  r.default_duration_s = defaultDuration ?? 15;
  r.total_songs = totalSongs ?? 20;

  const saved = await AppDataSource.getRepository(Round).save(r);
  return res.status(201).json({
    id: saved.id,
    name: saved.name,
    defaultDuration: saved.default_duration_s,
    totalSongs: saved.total_songs,
  });
});

// POST /api/rounds/:roundId/next
// Ferme/grade le morceau courant si besoin, puis ouvre le suivant
router.post("/rounds/:roundId/next", async (req, res) => {
  const { duration } = req.body ?? {};

  const roundRepo = AppDataSource.getRepository(Round);
  const songRepo = AppDataSource.getRepository(RoundSong);

  const round = await roundRepo.findOne({
    where: { id: String(req.params.roundId) },
    relations: ["event"],
  });
  if (!round)
    return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });

  const eventCode = ((round.event as any)?.code as string | undefined) ?? null;
  const eventId = ((round.event as any)?.id as string | undefined) ?? null;

  // 1) Si un morceau est ouvert, on le close + grade
  let currentOpen = await songRepo.findOne({
    where: { round_id: round.id, status: "open" },
  });
  let gradedSongId: string | null = null;

  if (currentOpen) {
    await gradeSongInternal(currentOpen, eventCode, eventId);
    gradedSongId = currentOpen.id;
  } else {
    // Sinon, s'il y a un "closed" non "scored", on le grade
    const closedNotScored = await songRepo.findOne({
      where: { round_id: round.id, status: "closed" },
      order: { idx: "ASC" },
    });
    if (closedNotScored) {
      await gradeSongInternal(closedNotScored, eventCode, eventId);
      gradedSongId = closedNotScored.id;
    }
  }

  // 2) Ouvrir le prochain "pending" (le plus petit idx)
  const nextSong = await songRepo.findOne({
    where: { round_id: round.id, status: "pending" },
    order: { idx: "ASC" },
  });

  if (!nextSong) {
    return res.json({
      previousSongId: gradedSongId,
      nextSongId: null,
      message: "NO_NEXT_SONG",
    });
  }

  const dur = Number(
    duration ?? nextSong.duration_s ?? round.default_duration_s ?? 15,
  );
  const startedAt = nowUtc();
  const endsAt = new Date(startedAt.getTime() + dur * 1000);

  nextSong.status = "open";
  nextSong.started_at = startedAt;
  nextSong.ended_at = endsAt;
  await songRepo.save(nextSong);

  if (eventCode) {
    io.to(`event:${eventCode}`).emit("round_started", {
      roundId: round.id,
      songId: nextSong.id,
      duration: dur,
      endsAt: endsAt.toISOString(),
    });
  }

  return res.json({
    previousSongId: gradedSongId,
    nextSongId: nextSong.id,
    duration: dur,
    endsAt: endsAt.toISOString(),
  });
});

// GET /api/rounds/:roundId
router.get("/rounds/:roundId", async (req, res) => {
  try {
    const roundId = req.params.roundId;
    const roundRepo = AppDataSource.getRepository(Round);
    const round = await roundRepo.findOne({ where: { id: roundId } });

    if (!round) {
      return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });
    }

    return res.json({
      id: round.id,
      name: round.name,
      default_duration_s: round.default_duration_s,
      total_songs: round.total_songs,
      created_at: round.created_at,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/rounds/:roundId/songs/count
router.get("/rounds/:roundId/songs/count", async (req, res) => {
  try {
    const roundId = req.params.roundId;
    const songRepo = AppDataSource.getRepository(RoundSong);
    const count = await songRepo.count({ where: { round_id: roundId } });

    return res.json({ count });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/rounds/:roundId/songs
router.get("/rounds/:roundId/songs", async (req, res) => {
  try {
    const roundId = req.params.roundId;
    const songRepo = AppDataSource.getRepository(RoundSong);
    const songs = await songRepo.find({
      where: { round_id: roundId },
      order: { idx: "ASC" },
    });

    const formattedSongs = songs.map((song) => ({
      id: song.id,
      idx: song.idx,
      title: song.title_official,
      artist: song.artist_official,
      duration: song.duration_s,
      status: song.status,
      mode: song.mode,
      aliases: song.aliases_json ? JSON.parse(song.aliases_json) : [],
      startedAt: song.started_at,
      endedAt: song.ended_at,
    }));

    return res.json({ songs: formattedSongs });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});

// GET /api/events/:code/rounds
router.get("/events/:code/rounds", async (req, res) => {
  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

  // Rounds sans charger toutes les songs (retour minimal)
  const rounds = await AppDataSource.getRepository(Round).find({
    where: { event_id: ev.id },
    order: { created_at: "ASC" },
  });

  // Format pour l'admin (avec wrapper)
  const adminFormat = {
    rounds: rounds.map((r) => ({
      id: r.id,
      name: r.name,
      default_duration_s: r.default_duration_s,
      total_songs: r.total_songs,
      created_at: r.created_at,
    })),
  };

  // Format pour le DJ (sans wrapper, propriétés différentes)
  const djFormat = rounds.map((r) => ({
    id: r.id,
    name: r.name,
    defaultDuration: r.default_duration_s,
    totalSongs: r.total_songs,
  }));

  // Vérifier si c'est une demande du DJ (basé sur user-agent ou header)
  const isDjRequest =
    req.headers["user-agent"]?.includes("DJ") ||
    req.headers["x-client-type"] === "dj" ||
    req.query.format === "dj";

  return res.json(isDjRequest ? djFormat : adminFormat);
});

export default router;
// DELETE /api/rounds/:roundId
router.delete("/rounds/:roundId", async (req, res) => {
  try {
    const roundId = String(req.params.roundId);
    const repo = AppDataSource.getRepository(Round);
    const existing = await repo.findOne({ where: { id: roundId } });
    if (!existing) {
      return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });
    }
    await repo.delete({ id: roundId } as any);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) },
    });
  }
});
