import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Score } from "../../db/entities/Score";
import { Team } from "../../db/entities/Team";
import { Round } from "../../db/entities/Round";
import { Table } from "../../db/entities/Table";

const router = Router();

/**
 * Middleware pour vérifier l'accès aux scores
 * - Organisateur : accès illimité via token staff
 * - Participant : accès pendant l'événement + 24h après la fin
 */
async function checkScoreAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    const eventRepo = AppDataSource.getRepository(Event);

    const event = await eventRepo.findOne({ where: { code } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Si l'utilisateur est un organisateur/staff, accès illimité
    const staff = (req as any).staff;
    if (staff) {
      // Vérifier que le staff appartient au même tenant que l'événement
      const tenantContext = (req as any).tenant;
      if (
        (tenantContext?.tenantId && tenantContext.tenantId === event.tenant_id) ||
        (staff.organizerId && event.organizer && event.organizer.id === String(staff.organizerId))
      ) {
        return next(); // Accès autorisé pour l'organisateur
      }
    }

    // Pour les participants (accès public), vérifier la période de consultation
    if (event.end_date) {
      const now = new Date();
      const consultationLimit = new Date(event.end_date);
      consultationLimit.setDate(consultationLimit.getDate() + 1); // +24 heures

      if (now > consultationLimit) {
        return res.status(403).json({
          error: {
            code: "SCORE_ACCESS_EXPIRED",
            message: "La consultation des scores n'est plus disponible pour cet événement (24h après la fin)"
          }
        });
      }
    }

    // Accès autorisé (événement en cours ou dans la période de consultation)
    next();
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
}

// GET /api/events/:code/leaderboard
router.get("/events/:code/leaderboard", checkScoreAccess, async (req, res) => {
  const ev = await AppDataSource.getRepository(Event).findOne({
    where: { code: req.params.code },
  });
  if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

  // s'appuie sur la table 'scores' (maintenue par triggers du SQL)
  const scoreRepo = AppDataSource.getRepository(Score);
  const teamRepo = AppDataSource.getRepository(Team);

  const scores = await scoreRepo.find({ where: { event_id: ev.id } });
  const teams = await teamRepo.find({ where: { event_id: ev.id } });

  const merged = scores
    .map((s) => ({
      teamId: s.team_id,
      name: teams.find((t) => t.id === s.team_id)?.name ?? "???",
      totalPoints: s.total_points,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((x, i) => ({ ...x, rank: i + 1 }));

  return res.json(merged);
});

// GET /api/events/:code/scores - Get scores for an event
router.get("/events/:code/scores", checkScoreAccess, async (req, res) => {
  try {
    const { code } = req.params;
    const eventRepo = AppDataSource.getRepository(Event);
    const scoreRepo = AppDataSource.getRepository(Score);
    const teamRepo = AppDataSource.getRepository(Team);

    const event = await eventRepo.findOne({ where: { code } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    const scores = await scoreRepo.find({ where: { event_id: event.id } });
    const teams = await teamRepo.find({ where: { event_id: event.id } });

    const scoresWithTeams = scores.map(score => {
      const team = teams.find(t => t.id === score.team_id);
      return {
        teamId: score.team_id,
        teamName: team?.name || 'Unknown Team',
        totalPoints: score.total_points,
        lastUpdated: score.updated_at
      };
    });

    return res.json(scoresWithTeams.sort((a, b) => b.totalPoints - a.totalPoints));
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// GET /api/events/:code/detailed-scores - Get detailed scores by song
router.get("/events/:code/detailed-scores", checkScoreAccess, async (req, res) => {
  try {
    const { code } = req.params;

    // Récupérer l'événement
    const event = await AppDataSource.getRepository(Event).findOne({
      where: { code },
      relations: ["rounds"],
    });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Récupérer toutes les équipes de l'événement
    const teams = await AppDataSource.getRepository(Team).find({
      where: { event_id: event.id },
      order: { name: "ASC" },
    });

    // Récupérer tous les rounds avec leurs chansons
    const rounds = await AppDataSource.getRepository(Round).find({
      where: { event_id: event.id },
      relations: ["songs", "songs.answers"],
      order: { id: "ASC" },
    });

    // Structure des données : équipes en colonnes, chansons en lignes
    const songs: Array<{
      id: string;
      roundIdx: number;
      songIdx: number;
      title: string;
      artist: string;
      teamScores: { [teamId: string]: number };
    }> = [];

    // Parcourir tous les rounds et chansons
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex];
      if (!round.songs) continue;

      for (const song of round.songs) {
        const songData = {
          id: song.id,
          roundIdx: roundIndex + 1, // Index basé sur 1 pour l'affichage
          songIdx: song.idx,
          title: song.title_official || `Chanson ${song.idx}`,
          artist: song.artist_official || "",
          teamScores: {} as { [teamId: string]: number },
        };

        // Initialiser les scores à 0 pour toutes les équipes
        teams.forEach(team => {
          songData.teamScores[team.id] = 0;
        });

        // Remplir les scores réels depuis les réponses
        if (song.answers) {
          song.answers.forEach((answer: any) => {
            songData.teamScores[answer.team_id] = answer.points || 0;
          });
        }

        songs.push(songData);
      }
    }

    // Calculer les totaux par équipe
    const teamTotals: { [teamId: string]: number } = {};
    teams.forEach(team => {
      teamTotals[team.id] = songs.reduce((sum, song) => sum + (song.teamScores[team.id] || 0), 0);
    });

    return res.json({
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        totalPoints: teamTotals[t.id] || 0,
      })),
      songs,
      totalSongs: songs.length,
      totalTeams: teams.length,
    });
  } catch (error) {
    console.error("Error in detailed-scores:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// GET /api/events/:code/rounds/:roundId/scores - Get scores for a specific round
router.get("/events/:code/rounds/:roundId/scores", checkScoreAccess, async (req, res) => {
  try {
    const { code, roundId } = req.params;

    // Récupérer l'événement
    const event = await AppDataSource.getRepository(Event).findOne({
      where: { code },
    });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Récupérer le round spécifique
    const round = await AppDataSource.getRepository(Round).findOne({
      where: { id: roundId, event_id: event.id },
      relations: ["songs", "songs.answers"],
    });

    if (!round) {
      return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });
    }

    // Récupérer toutes les équipes de l'événement
    const teams = await AppDataSource.getRepository(Team).find({
      where: { event_id: event.id },
      order: { name: "ASC" },
    });

    // Récupérer les scores totaux actuels
    const scores = await AppDataSource.getRepository(Score).find({
      where: { event_id: event.id },
    });

    // Calculer les points du round pour chaque équipe
    const roundScores: { [teamId: string]: number } = {};
    teams.forEach(team => {
      roundScores[team.id] = 0;
    });

    // Parcourir toutes les chansons du round
    if (round.songs) {
      for (const song of round.songs) {
        if (song.answers) {
          song.answers.forEach((answer: any) => {
            roundScores[answer.team_id] = (roundScores[answer.team_id] || 0) + (answer.points || 0);
          });
        }
      }
    }

    // Créer le tableau de résultats avec points du round et total
    const roundScoresArray = teams.map(team => {
      const totalScore = scores.find(s => s.team_id === team.id);
      return {
        teamId: team.id,
        name: team.name,
        roundPoints: roundScores[team.id] || 0,
        totalPoints: totalScore?.total_points || 0,
      };
    });

    // Trier par total de points (décroissant)
    roundScoresArray.sort((a, b) => b.totalPoints - a.totalPoints);

    // Ajouter le rang
    const rankedScores = roundScoresArray.map((score, index) => ({
      ...score,
      rank: index + 1,
    }));

    // Déterminer le numéro du round
    const allRounds = await AppDataSource.getRepository(Round).find({
      where: { event_id: event.id },
      order: { id: "ASC" },
    });
    const roundNumber = allRounds.findIndex(r => r.id === roundId) + 1;

    return res.json({
      roundNumber,
      roundId: round.id,
      roundScores: rankedScores,
    });
  } catch (error) {
    console.error("Error in round scores:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// GET /api/events/:code/table-leaderboard - Classement par table
router.get("/events/:code/table-leaderboard", checkScoreAccess, async (req, res) => {
  try {
    const event = await AppDataSource.getRepository(Event).findOne({
      where: { code: req.params.code },
    });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Vérifier que l'événement est en mode table
    if (!event.table_mode) {
      return res.status(400).json({
        error: { code: "TABLE_MODE_NOT_ENABLED", message: "This event is not in table mode" }
      });
    }

    const tableRepo = AppDataSource.getRepository(Table);
    const teamRepo = AppDataSource.getRepository(Team);
    const scoreRepo = AppDataSource.getRepository(Score);

    // Récupérer toutes les tables de l'événement
    const tables = await tableRepo.find({
      where: { event_id: event.id },
      relations: ["teams"]
    });

    // Récupérer toutes les équipes et leurs scores
    const teams = await teamRepo.find({
      where: { event_id: event.id }
    });

    const scores = await scoreRepo.find({
      where: { event_id: event.id }
    });

    // Calculer les scores par table
    const tableScores = tables.map(table => {
      // Trouver toutes les équipes de cette table
      const tableTeams = teams.filter(t => t.table_id === table.id);

      // Calculer le score total de la table (somme des scores des équipes)
      const totalPoints = tableTeams.reduce((sum, team) => {
        const teamScore = scores.find(s => s.team_id === team.id);
        return sum + (teamScore?.total_points || 0);
      }, 0);

      return {
        tableId: table.id,
        tableName: table.name,
        totalPoints,
        teamsCount: tableTeams.length,
        teams: tableTeams.map(team => {
          const teamScore = scores.find(s => s.team_id === team.id);
          return {
            id: team.id,
            name: team.name,
            points: teamScore?.total_points || 0
          };
        }).sort((a, b) => b.points - a.points)
      };
    });

    // Trier les tables par score décroissant
    tableScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // Ajouter le rang
    const rankedTables = tableScores.map((table, index) => ({
      ...table,
      rank: index + 1
    }));

    return res.json(rankedTables);
  } catch (error) {
    console.error("Error in table-leaderboard:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// GET /api/events/:code/rounds/:roundId/table-scores - Scores des tables pour un round spécifique
router.get("/events/:code/rounds/:roundId/table-scores", checkScoreAccess, async (req, res) => {
  try {
    const { code, roundId } = req.params;

    const event = await AppDataSource.getRepository(Event).findOne({
      where: { code },
    });

    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Vérifier que l'événement est en mode table
    if (!event.table_mode) {
      return res.status(400).json({
        error: { code: "TABLE_MODE_NOT_ENABLED", message: "This event is not in table mode" }
      });
    }

    // Récupérer le round spécifique
    const round = await AppDataSource.getRepository(Round).findOne({
      where: { id: roundId, event_id: event.id },
      relations: ["songs", "songs.answers"],
    });

    if (!round) {
      return res.status(404).json({ error: { code: "ROUND_NOT_FOUND" } });
    }

    const tableRepo = AppDataSource.getRepository(Table);
    const teamRepo = AppDataSource.getRepository(Team);
    const scoreRepo = AppDataSource.getRepository(Score);

    // Récupérer toutes les tables
    const tables = await tableRepo.find({
      where: { event_id: event.id }
    });

    // Récupérer toutes les équipes
    const teams = await teamRepo.find({
      where: { event_id: event.id }
    });

    // Récupérer les scores totaux actuels
    const scores = await scoreRepo.find({
      where: { event_id: event.id }
    });

    // Calculer les points du round pour chaque équipe
    const roundScores: { [teamId: string]: number } = {};
    teams.forEach(team => {
      roundScores[team.id] = 0;
    });

    if (round.songs) {
      for (const song of round.songs) {
        if (song.answers) {
          song.answers.forEach((answer: any) => {
            roundScores[answer.team_id] = (roundScores[answer.team_id] || 0) + (answer.points || 0);
          });
        }
      }
    }

    // Calculer les scores par table
    const tableScores = tables.map(table => {
      const tableTeams = teams.filter(t => t.table_id === table.id);

      // Points du round pour cette table
      const roundPoints = tableTeams.reduce((sum, team) => {
        return sum + (roundScores[team.id] || 0);
      }, 0);

      // Points totaux pour cette table
      const totalPoints = tableTeams.reduce((sum, team) => {
        const teamScore = scores.find(s => s.team_id === team.id);
        return sum + (teamScore?.total_points || 0);
      }, 0);

      return {
        tableId: table.id,
        tableName: table.name,
        roundPoints,
        totalPoints,
        teamsCount: tableTeams.length
      };
    });

    // Trier par total de points
    tableScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // Ajouter le rang
    const rankedTables = tableScores.map((table, index) => ({
      ...table,
      rank: index + 1
    }));

    // Déterminer le numéro du round
    const allRounds = await AppDataSource.getRepository(Round).find({
      where: { event_id: event.id },
      order: { id: "ASC" },
    });
    const roundNumber = allRounds.findIndex(r => r.id === roundId) + 1;

    return res.json({
      roundNumber,
      roundId: round.id,
      tableScores: rankedTables
    });
  } catch (error) {
    console.error("Error in round table scores:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

export default router;
