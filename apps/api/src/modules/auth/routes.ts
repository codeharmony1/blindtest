import { Router } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../db/data-source";
import { Organizer } from "../../db/entities/Organizer";
import { Event } from "../../db/entities/Event";
import { EventStaff } from "../../db/entities/EventStaff";
import { TenantUser } from "../../db/entities/TenantUser";
import { issueStaffToken, verifyRefreshToken, issueOrganizerTokenPair, issueTenantUserTokenPair, issueDJToken } from "../../services/tokens.service";
import { authRateLimit } from "../../middlewares/rate-limit";
import { generateSecurePIN, hashPIN, verifyPIN, isValidPINFormat } from "../../services/pin.service";

const router = Router();

// Appliquer rate limiting à toutes les routes d'authentification
router.use(authRateLimit);

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
    const event = await eventRepo.findOne({
      where: { code: eventCode },
      relations: ['organizer']
    });
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
    if (!staff && event.organizer?.id === organizer.id) {
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

// POST /api/auth/organizer-login - Connexion organisateur (sans eventCode)
router.post("/auth/organizer-login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "email and password required"
        }
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

    // Créer un token ADMIN sans eventCode spécifique
    const token = issueStaffToken("ADMIN", organizer.id, "");

    return res.json({
      token,
      organizer: {
        id: organizer.id,
        email: organizer.email,
        displayName: organizer.display_name
      }
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

    // Vérifier le refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        error: { code: "INVALID_REFRESH_TOKEN" }
      });
    }

    // Distinguer entre Organizer et TenantUser
    if (decoded.organizerId) {
      // C'est un Organizer
      const orgRepo = AppDataSource.getRepository(Organizer);
      const organizer = await orgRepo.findOne({
        where: { id: decoded.organizerId }
      });

      if (!organizer) {
        return res.status(404).json({
          error: { code: "USER_NOT_FOUND" }
        });
      }

      // Générer une nouvelle paire de tokens
      const tokens = issueOrganizerTokenPair(
        organizer.id,
        organizer.email,
        "ADMIN",
        ""
      );

      return res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        organizer: {
          id: organizer.id,
          email: organizer.email,
          displayName: organizer.display_name
        }
      });
    } else if (decoded.userId && decoded.tenantId) {
      // C'est un TenantUser
      const userRepo = AppDataSource.getRepository(TenantUser);
      const user = await userRepo.findOne({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({
          error: { code: "USER_NOT_FOUND" }
        });
      }

      // Générer une nouvelle paire de tokens
      const tokens = issueTenantUserTokenPair(
        user.id,
        user.tenant_id,
        user.email,
        user.role
      );

      return res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    }

    return res.status(400).json({
      error: { code: "INVALID_TOKEN_TYPE" }
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: String(error) }
    });
  }
});

// POST /api/auth/dj-pin-login - Connexion DJ par code PIN
router.post("/auth/dj-pin-login", async (req, res) => {
  try {
    const { eventCode, pin } = req.body ?? {};

    // Validation des paramètres
    if (!eventCode || !pin) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "eventCode and pin required"
        }
      });
    }

    // Validation du format du PIN
    if (!isValidPINFormat(pin)) {
      return res.status(400).json({
        error: {
          code: "INVALID_PIN_FORMAT",
          message: "PIN must be exactly 6 digits"
        }
      });
    }

    // Rechercher l'événement
    const eventRepo = AppDataSource.getRepository(Event);
    const event = await eventRepo.findOne({
      where: { code: eventCode.toUpperCase() }
    });

    if (!event) {
      return res.status(404).json({
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found"
        }
      });
    }

    // Vérifier que l'événement a un PIN configuré
    if (!event.dj_pin_hash) {
      return res.status(403).json({
        error: {
          code: "DJ_PIN_NOT_CONFIGURED",
          message: "DJ PIN not configured for this event"
        }
      });
    }

    // Vérifier le PIN
    const isValidPIN = await verifyPIN(pin, event.dj_pin_hash);
    if (!isValidPIN) {
      return res.status(401).json({
        error: {
          code: "INVALID_PIN",
          message: "Invalid DJ PIN"
        }
      });
    }

    // Générer le token JWT
    const token = issueDJToken(event.code, event.id);

    return res.json({
      token,
      event: {
        id: event.id,
        code: event.code,
        name: event.name,
        status: event.status
      },
      role: "DJ"
    });
  } catch (error) {
    console.error("[AUTH] DJ PIN login error:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: String(error)
      }
    });
  }
});

export default router;