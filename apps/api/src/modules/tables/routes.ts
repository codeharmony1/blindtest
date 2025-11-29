import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Table } from "../../db/entities/Table";
import { Team } from "../../db/entities/Team";

const router = Router();

// GET /api/events/:code/tables - Lister toutes les tables d'un événement
router.get("/events/:code/tables", async (req, res) => {
  try {
    const ev = await AppDataSource.getRepository(Event).findOne({
      where: { code: req.params.code },
    });
    if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

    // Vérifier si l'événement est en mode table
    if (!ev.table_mode) {
      return res.status(400).json({
        error: { code: "TABLE_MODE_NOT_ENABLED", message: "This event is not in table mode" }
      });
    }

    const tables = await AppDataSource.getRepository(Table).find({
      where: { event_id: ev.id },
      relations: ["teams"],
      order: { created_at: "ASC" }
    });

    return res.json(
      tables.map((t) => ({
        id: t.id,
        name: t.name,
        teamsCount: t.teams?.length || 0,
        createdAt: t.created_at,
      })),
    );
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/events/:code/tables - Créer une nouvelle table
router.post("/events/:code/tables", async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (!name) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "name required" }
      });
    }

    const ev = await AppDataSource.getRepository(Event).findOne({
      where: { code: req.params.code },
    });
    if (!ev) return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });

    // Vérifier si l'événement est en mode table
    if (!ev.table_mode) {
      return res.status(400).json({
        error: { code: "TABLE_MODE_NOT_ENABLED", message: "This event is not in table mode" }
      });
    }

    const tableRepo = AppDataSource.getRepository(Table);
    const existing = await tableRepo.findOne({
      where: { event_id: ev.id, name }
    });
    if (existing) {
      return res.status(409).json({ error: { code: "TABLE_NAME_TAKEN" } });
    }

    const table = new Table();
    table.event_id = ev.id;
    table.tenant_id = ev.tenant_id;
    table.name = name;

    const saved = await tableRepo.save(table);
    return res.status(201).json({
      id: saved.id,
      name: saved.name,
      createdAt: saved.created_at
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/teams/:teamId/join-table - Une équipe rejoint une table
router.post("/teams/:teamId/join-table", async (req, res) => {
  try {
    const { tableId } = req.body ?? {};
    if (!tableId) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "tableId required" }
      });
    }

    const teamRepo = AppDataSource.getRepository(Team);
    const tableRepo = AppDataSource.getRepository(Table);

    const team = await teamRepo.findOne({
      where: { id: req.params.teamId },
      relations: ["event"]
    });
    if (!team) {
      return res.status(404).json({ error: { code: "TEAM_NOT_FOUND" } });
    }

    // Vérifier si l'événement est en mode table
    if (!team.event.table_mode) {
      return res.status(400).json({
        error: { code: "TABLE_MODE_NOT_ENABLED", message: "This event is not in table mode" }
      });
    }

    // Vérifier si l'équipe a déjà une table
    if (team.table_id) {
      return res.status(400).json({
        error: { code: "TEAM_ALREADY_HAS_TABLE", message: "Team already belongs to a table" }
      });
    }

    const table = await tableRepo.findOne({
      where: { id: String(tableId) }
    });
    if (!table) {
      return res.status(404).json({ error: { code: "TABLE_NOT_FOUND" } });
    }

    // Vérifier que la table appartient au même événement
    if (table.event_id !== team.event_id) {
      return res.status(400).json({
        error: { code: "TABLE_EVENT_MISMATCH", message: "Table does not belong to the same event" }
      });
    }

    // Assigner l'équipe à la table
    team.table_id = table.id;
    await teamRepo.save(team);

    return res.json({
      teamId: team.id,
      teamName: team.name,
      tableId: table.id,
      tableName: table.name
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// GET /api/tables/:tableId/teams - Obtenir toutes les équipes d'une table
router.get("/tables/:tableId/teams", async (req, res) => {
  try {
    const tableRepo = AppDataSource.getRepository(Table);
    const table = await tableRepo.findOne({
      where: { id: req.params.tableId },
      relations: ["teams", "teams.players"]
    });

    if (!table) {
      return res.status(404).json({ error: { code: "TABLE_NOT_FOUND" } });
    }

    return res.json({
      tableId: table.id,
      tableName: table.name,
      teams: table.teams.map(t => ({
        id: t.id,
        name: t.name,
        playersCount: t.players?.length || 0,
        manualParticipantsCount: t.manual_participants_count
      }))
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

export default router;
