import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Score } from "../../db/entities/Score";
import { Team } from "../../db/entities/Team";

const router = Router();

// GET /api/events/:code/leaderboard
router.get("/events/:code/leaderboard", async (req, res) => {
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
router.get("/events/:code/scores", async (req, res) => {
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

export default router;
