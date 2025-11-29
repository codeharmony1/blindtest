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
  if (!nickname)
    return res
      .status(400)
      .json({
        error: { code: "BAD_REQUEST", message: "nickname required" },
      });

  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

  // En mode SOLO, on ne requiert pas de teamId car on crée automatiquement une équipe
  // En mode TEAM, teamId est obligatoire
  if (ev.game_mode === "TEAM" && !teamId) {
    return res.status(400).json({
      error: { code: "BAD_REQUEST", message: "teamId required in TEAM mode" },
    });
  }

  const teamRepo = AppDataSource.getRepository(Team);
  let team: Team | null = null;

  if (ev.game_mode === "SOLO") {
    // Mode SOLO : créer automatiquement une équipe individuelle avec le pseudo du joueur
    // Vérifier que le nom d'équipe (= pseudo) n'existe pas déjà
    const existingTeam = await teamRepo.findOne({
      where: { event_id: ev.id, name: nickname },
    });
    if (existingTeam) {
      return res.status(409).json({
        error: { code: "PLAYER_NICK_TAKEN", message: "Ce pseudo est déjà pris" },
      });
    }

    // Créer l'équipe individuelle
    const newTeam = new Team();
    newTeam.event = ev;
    newTeam.event_id = ev.id;
    newTeam.tenant_id = ev.tenant_id;
    newTeam.name = nickname;
    newTeam.manual_participants_count = 0;
    team = await teamRepo.save(newTeam);
  } else {
    // Mode TEAM : utiliser l'équipe existante fournie
    team = await teamRepo.findOne({
      where: { id: String(teamId), event_id: ev.id },
    });
    if (!team) return res.status(404).json({ error: { code: "TEAM_NOT_FOUND" } });
  }

  const playerRepo = AppDataSource.getRepository(Player);

  // En mode TEAM, vérifier l'unicité du pseudo dans tout l'événement
  // En mode SOLO, cette vérification a déjà été faite via le nom d'équipe
  if (ev.game_mode === "TEAM") {
    const exists = await playerRepo.findOne({
      where: { event_id: ev.id, nickname },
    });
    if (exists)
      return res.status(409).json({ error: { code: "PLAYER_NICK_TAKEN" } });
  }

  // Vérifier si c'est le premier joueur de l'équipe
  const existingPlayers = await playerRepo.count({
    where: { team_id: team.id },
  });
  const isFirstPlayer = existingPlayers === 0;

  const p = new Player();
  p.event = ev;
  p.event_id = ev.id;
  p.team = team;
  p.team_id = team.id;
  p.tenant_id = ev.tenant_id;
  p.nickname = nickname;
  p.is_captain = isFirstPlayer; // Premier joueur = capitaine
  const saved = await playerRepo.save(p);

  // Mettre à jour le capitaine de l'équipe si c'est le premier joueur
  if (isFirstPlayer) {
    team.captain_player_id = saved.id;
    await teamRepo.save(team);
  }

  const token = issuePlayerToken(ev.code, team.id, saved.id);
  return res.json({
    teamToken: token,
    player: { id: saved.id, nickname, teamId: team.id, isCaptain: isFirstPlayer },
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

// DELETE /api/players/:id - Delete a player (DJ/Admin only)
router.delete("/players/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const playerRepo = AppDataSource.getRepository(Player);
    const teamRepo = AppDataSource.getRepository(Team);

    const player = await playerRepo.findOne({
      where: { id },
      relations: ['team']
    });

    if (!player) {
      return res.status(404).json({ error: { code: "PLAYER_NOT_FOUND" } });
    }

    const teamId = player.team_id;
    const wasCaptain = player.is_captain;

    // Supprimer le joueur
    await playerRepo.remove(player);

    // Si c'était le capitaine, promouvoir un autre joueur
    if (wasCaptain && teamId) {
      const remainingPlayers = await playerRepo.find({
        where: { team_id: teamId },
        order: { created_at: 'ASC' }
      });

      if (remainingPlayers.length > 0) {
        // Le premier joueur restant devient capitaine
        const newCaptain = remainingPlayers[0];
        newCaptain.is_captain = true;
        await playerRepo.save(newCaptain);

        // Mettre à jour l'équipe
        const team = await teamRepo.findOne({ where: { id: teamId } });
        if (team) {
          team.captain_player_id = newCaptain.id;
          await teamRepo.save(team);
        }
      } else {
        // Plus de joueurs dans l'équipe, retirer le capitaine
        const team = await teamRepo.findOne({ where: { id: teamId } });
        if (team) {
          team.captain_player_id = null;
          await teamRepo.save(team);
        }
      }
    }

    return res.json({ success: true, message: "Player deleted" });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

export default router;
