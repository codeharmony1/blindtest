import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Team } from "../../db/entities/Team";
import { Player } from "../../db/entities/Player";

const router = Router();

// GET /api/events/:code/teams
router.get("/events/:code/teams", async (req, res) => {
  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
  const teams = await AppDataSource.getRepository(Team).find({
    where: { event_id: ev.id },
  });
  return res.json(
    teams.map((t) => ({
      id: t.id,
      name: t.name,
      captainPlayerId: t.captain_player_id,
      manualParticipantsCount: t.manual_participants_count,
    })),
  );
});

// POST /api/events/:code/teams
router.post("/events/:code/teams", async (req, res) => {
  const { name } = req.body ?? {};
  if (!name)
    return res
      .status(400)
      .json({ error: { code: "BAD_REQUEST", message: "name required" } });
  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

  const teamRepo = AppDataSource.getRepository(Team);
  const existing = await teamRepo.findOne({ where: { event_id: ev.id, name } });
  if (existing)
    return res.status(409).json({ error: { code: "TEAM_NAME_TAKEN" } });

  const team = new Team();
  team.event = ev;
  team.event_id = ev.id;
  team.name = name;
  team.manual_participants_count = 0;
  const saved = await teamRepo.save(team);
  return res.status(201).json({ id: saved.id, name: saved.name });
});

// POST /api/teams/:id/captain - Nommer un capitaine
router.post("/teams/:id/captain", async (req, res) => {
  try {
    const { playerId } = req.body ?? {};
    if (!playerId) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "playerId required" }
      });
    }

    const teamRepo = AppDataSource.getRepository(Team);
    const playerRepo = AppDataSource.getRepository(Player);

    const team = await teamRepo.findOne({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: { code: "TEAM_NOT_FOUND" } });
    }

    const player = await playerRepo.findOne({
      where: { id: String(playerId), team_id: team.id }
    });
    if (!player) {
      return res.status(404).json({ error: { code: "PLAYER_NOT_IN_TEAM" } });
    }

    // Retirer le statut de capitaine à l'ancien capitaine
    if (team.captain_player_id) {
      await playerRepo.update(
        { id: team.captain_player_id },
        { is_captain: false }
      );
    }

    // Définir le nouveau capitaine
    await playerRepo.update({ id: player.id }, { is_captain: true });
    team.captain_player_id = player.id;
    await teamRepo.save(team);

    return res.json({
      teamId: team.id,
      captainPlayerId: player.id,
      captainNickname: player.nickname
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// PATCH /api/teams/:id/participants - Modifier le nombre de participants manuels
router.patch("/teams/:id/participants", async (req, res) => {
  try {
    const { manualParticipantsCount } = req.body ?? {};
    if (typeof manualParticipantsCount !== "number" || manualParticipantsCount < 0) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "manualParticipantsCount must be a non-negative number"
        }
      });
    }

    const teamRepo = AppDataSource.getRepository(Team);
    const team = await teamRepo.findOne({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: { code: "TEAM_NOT_FOUND" } });
    }

    team.manual_participants_count = manualParticipantsCount;
    const saved = await teamRepo.save(team);

    return res.json({
      id: saved.id,
      name: saved.name,
      manualParticipantsCount: saved.manual_participants_count
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

export default router;
