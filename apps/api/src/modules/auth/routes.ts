import { Router } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../db/data-source";
import { Organizer } from "../../db/entities/Organizer";
import { Event } from "../../db/entities/Event";
import { EventStaff } from "../../db/entities/EventStaff";
import { issueStaffToken } from "../../services/tokens.service";

const router = Router();

// POST /api/auth/register - Créer un compte organisateur
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "email & password required" }
      });
    }

    const orgRepo = AppDataSource.getRepository(Organizer);
    const existing = await orgRepo.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { code: "EMAIL_ALREADY_EXISTS" } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const organizer = orgRepo.create({
      email,
      password_hash: hashedPassword,
      display_name: displayName || null
    });

    const saved = await orgRepo.save(organizer);
    return res.status(201).json({
      id: saved.id,
      email: saved.email,
      displayName: saved.display_name,
      createdAt: saved.created_at
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/auth/login - Connexion admin/DJ
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password, eventCode, role } = req.body ?? {};
    if (!email || !password || !eventCode || !role) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "email, password, eventCode & role required"
        }
      });
    }

    if (!["ADMIN", "DJ", "DISPLAY"].includes(role)) {
      return res.status(400).json({
        error: { code: "INVALID_ROLE" }
      });
    }

    const orgRepo = AppDataSource.getRepository(Organizer);
    const organizer = await orgRepo.findOne({ where: { email } });
    if (!organizer) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS" } });
    }

    const validPassword = await bcrypt.compare(password, organizer.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS" } });
    }

    const eventRepo = AppDataSource.getRepository(Event);
    const event = await eventRepo.findOne({ where: { code: eventCode } });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // Vérifier l'accès à l'événement
    const staffRepo = AppDataSource.getRepository(EventStaff);
    let staff = await staffRepo.findOne({
      where: {
        event_id: event.id,
        organizer_id: organizer.id,
        role: role as any
      }
    });

    // Si pas de staff existant et que c'est le propriétaire de l'événement, créer automatiquement
    if (!staff && event.organizer.id === organizer.id) {
      staff = staffRepo.create({
        event_id: event.id,
        organizer_id: organizer.id,
        role: role as any,
        event,
        organizer
      });
      await staffRepo.save(staff);
    }

    if (!staff) {
      return res.status(403).json({ error: { code: "NO_EVENT_ACCESS" } });
    }

    const token = issueStaffToken(role as any, organizer.id, eventCode);

    return res.json({
      token,
      organizer: {
        id: organizer.id,
        email: organizer.email,
        displayName: organizer.display_name
      },
      event: {
        code: event.code,
        name: event.name
      },
      role
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/auth/refresh - Rafraîchir le token
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return res.status(400).json({
        error: { code: "REFRESH_TOKEN_REQUIRED" }
      });
    }

    // TODO: Implémenter la logique de refresh avec refresh tokens
    return res.status(501).json({ error: { code: "NOT_IMPLEMENTED" } });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

export default router;