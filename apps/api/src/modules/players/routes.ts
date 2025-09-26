import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Team } from "../../db/entities/Team";
import { Player } from "../../db/entities/Player";
import { issuePlayerToken } from "../../services/tokens.service";

const router = Router();

// POST /api/events/:code/join
router.post("/events/:code/join", async (req, res) => {
  const { teamId, nickname } = req.body ?? {};
  if (!teamId || !nickname)
    return res
      .status(400)
      .json({
        error: { code: "BAD_REQUEST", message: "teamId & nickname required" },
      });

  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

  const team = await AppDataSource.getRepository(Team).findOne({
    where: { id: String(teamId), event_id: ev.id },
  });
  if (!team) return res.status(404).json({ error: { code: "TEAM_NOT_FOUND" } });

  const playerRepo = AppDataSource.getRepository(Player);
  const exists = await playerRepo.findOne({
    where: { event_id: ev.id, nickname },
  });
  if (exists)
    return res.status(409).json({ error: { code: "PLAYER_NICK_TAKEN" } });

  const p = new Player();
  p.event = ev;
  p.event_id = ev.id;
  p.team = team;
  p.team_id = team.id;
  p.nickname = nickname;
  p.is_captain = false;
  const saved = await playerRepo.save(p);

  const token = issuePlayerToken(ev.code, team.id, saved.id);
  return res.json({
    teamToken: token,
    player: { id: saved.id, nickname, teamId: team.id, isCaptain: false },
  });
});

// GET /api/events/:code/players - List players for an event
router.get("/events/:code/players", async (req, res) => {
  try {
    const { code } = req.params;
    const eventRepo = AppDataSource.getRepository(Event);
    const playerRepo = AppDataSource.getRepository(Player);

    const event = await eventRepo.findOne({ where: { code } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    const players = await playerRepo.find({
      relations: ['team'],
      where: { team: { event_id: event.id } }
    });

    return res.json(
      players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        teamId: p.team_id,
        teamName: p.team?.name,
        isCaptain: p.is_captain,
        createdAt: p.created_at
      }))
    );
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

export default router;
