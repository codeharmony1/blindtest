import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../db/data-source";
import { RoundSong } from "../db/entities/RoundSong";

export interface TemporalRequest extends Request {
  song?: RoundSong;
  isWithinTimeWindow?: boolean;
}

// Middleware pour valider qu'une chanson est ouverte aux soumissions
export async function requireSongOpen(
  req: TemporalRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const songId = req.params.songId || req.body.songId;
    if (!songId) {
      return res.status(400).json({
        error: { code: "SONG_ID_REQUIRED" }
      });
    }

    const songRepo = AppDataSource.getRepository(RoundSong);
    const song = await songRepo.findOne({ where: { id: String(songId) } });

    if (!song) {
      return res.status(404).json({
        error: { code: "SONG_NOT_FOUND" }
      });
    }

    if (song.status !== "open") {
      return res.status(409).json({
        error: {
          code: "SONG_NOT_OPEN",
          message: `Song status is ${song.status}, expected "open"`
        }
      });
    }

    // Vérifier que nous sommes dans la fenêtre temporelle
    const now = new Date();
    const isWithinTimeWindow = song.started_at &&
      (!song.ended_at || now <= song.ended_at);

    if (!isWithinTimeWindow) {
      return res.status(409).json({
        error: {
          code: "SUBMISSION_WINDOW_CLOSED",
          message: "Submission window has closed"
        }
      });
    }

    req.song = song;
    req.isWithinTimeWindow = isWithinTimeWindow;
    next();
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
}

// Middleware pour valider les autorisations temporelles strictes (0:00 exact)
export function requireStrictTimeWindow(
  req: TemporalRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.song) {
    return res.status(500).json({
      error: { code: "SONG_NOT_LOADED" }
    });
  }

  const now = new Date();
  const song = req.song;

  // Calculer la fenêtre de soumission basée sur la durée
  if (song.started_at) {
    const duration = song.duration_s || 15;
    const expectedEndTime = new Date(song.started_at.getTime() + duration * 1000);

    if (now > expectedEndTime) {
      return res.status(409).json({
        error: {
          code: "TIME_EXPIRED",
          message: "Submission time has expired",
          serverTime: now.toISOString(),
          deadline: expectedEndTime.toISOString()
        }
      });
    }
  }

  next();
}

// Utility pour calculer le temps restant
export function calculateTimeRemaining(song: RoundSong): number {
  if (!song.started_at) return 0;

  const now = Date.now();
  const duration = song.duration_s || 15;
  const endTime = song.started_at.getTime() + duration * 1000;

  return Math.max(0, endTime - now);
}

// Utility pour vérifier si une soumission est dans les temps
export function isSubmissionValid(song: RoundSong, submissionTime: Date = new Date()): boolean {
  if (!song.started_at || song.status !== "open") return false;

  const duration = song.duration_s || 15;
  const endTime = new Date(song.started_at.getTime() + duration * 1000);

  return submissionTime <= endTime;
}