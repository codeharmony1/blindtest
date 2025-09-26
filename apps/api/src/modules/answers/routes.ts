// apps/api/src/modules/answers/routes.ts
import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Answer } from "../../db/entities/Answer";
import { RoundSong } from "../../db/entities/RoundSong";
import { Team } from "../../db/entities/Team";
import { Player } from "../../db/entities/Player";
import { requirePlayer, AuthedPlayer } from "../../middlewares/auth";
import { matchTitleArtist } from "../../services/matching.service";
import { computePoints } from "../../services/scoring.service";
import { answerRateLimit } from "../../middlewares/rate-limit";
import { requireSongOpen, requireStrictTimeWindow, TemporalRequest } from "../../middlewares/temporal-security";

const router = Router();

// HTTP fallback: POST /api/songs/:songId/answers (capitaine uniquement)
router.post(
  "/songs/:songId/answers",
  requirePlayer,
  answerRateLimit,
  requireSongOpen,
  requireStrictTimeWindow,
  async (req: AuthedPlayer & TemporalRequest, res) => {
    const { text } = req.body ?? {};
    if (!text) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "text required" }
      });
    }

    const teamRepo = AppDataSource.getRepository(Team);
    const playerRepo = AppDataSource.getRepository(Player);
    const ansRepo = AppDataSource.getRepository(Answer);

    // La chanson est déjà validée par les middlewares
    const song = req.song!;
    const now = new Date();

    const team = await teamRepo.findOne({
      where: { id: String(req.player!.teamId) },
      relations: ['captain']
    });
    if (!team) {
      return res.status(404).json({ error: { code: "TEAM_NOT_FOUND" } });
    }

    // Vérifier que le joueur est capitaine
    const player = await playerRepo.findOne({
      where: { id: String(req.player!.playerId) }
    });
    if (!player || !player.is_captain || team.captain_player_id !== player.id) {
      return res.status(403).json({
        error: {
          code: "CAPTAIN_ONLY",
          message: "Only the team captain can submit answers"
        }
      });
    }

    // Matching (peut donner 0 si les officiels ne sont pas encore saisis; grade corrigera après)
    const aliases = song.aliases_json
      ? (JSON.parse(song.aliases_json) as string[])
      : [];
    const m = matchTitleArtist(
      text,
      song.title_official ?? undefined,
      song.artist_official ?? undefined,
      aliases,
    );
    const pts = computePoints(m.matchTitle, m.matchArtist);

    // Upsert dernière réponse (unique par (song, team))
    let answer = await ansRepo.findOne({
      where: { round_song_id: song.id, team_id: team.id },
    });
    if (!answer) {
      answer = new Answer();
      answer.round_song_id = song.id;
      answer.team_id = team.id;
    }
    answer.text_raw = text;
    answer.text_norm = null;
    answer.submitted_at = now; // horloge serveur
    answer.match_title = m.matchTitle;
    answer.match_artist = m.matchArtist;
    answer.points = pts;

    const saved = await ansRepo.save(answer);
    return res.json({
      songId: song.id,
      teamId: team.id,
      accepted: true,
      submittedAt: saved.submitted_at.toISOString(),
      points: saved.points,
      matchTitle: saved.match_title,
      matchArtist: saved.match_artist
    });
  },
);

export default router;
