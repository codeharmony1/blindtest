import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppDataSource } from "../db/data-source";
import { Organizer } from "../db/entities/Organizer";
import { EventStaff } from "../db/entities/EventStaff";
import { Event } from "../db/entities/Event";

export interface AuthedPlayer extends Request {
  player?: {
    role: "PLAYER";
    eventCode: string;
    teamId: string;
    playerId: string;
  };
}

export interface AuthedStaff extends Request {
  staff?: {
    role: "ADMIN" | "DJ" | "DISPLAY";
    organizerId: string | null; // Null pour DJ authentifié par PIN
    eventCode: string;
    eventId: string;
    authMethod?: "PIN" | "EMAIL";
  };
}

export function requirePlayer(
  req: AuthedPlayer,
  res: Response,
  next: NextFunction,
) {
  const auth = req.headers.authorization;
  console.log(`[DEBUG requirePlayer] Authorization header:`, auth ? `Bearer ${auth.slice(7, 20)}...` : 'MISSING');
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    console.log(`[DEBUG requirePlayer] JWT payload:`, payload);
    if (payload.role !== "PLAYER") {
      console.log(`[ERROR requirePlayer] Role mismatch - expected PLAYER, got ${payload.role}`);
      return res.status(403).json({ error: { code: "FORBIDDEN", role: payload.role } });
    }
    req.player = payload;
    next();
  } catch (err) {
    console.log(`[ERROR requirePlayer] JWT verification failed:`, err);
    return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
}

export function requireStaff(
  req: AuthedStaff,
  res: Response,
  next: NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    // Support des tokens multi-tenant (avec userId, tenantId, role: OWNER/ADMIN/DJ/VIEWER)
    if (payload.userId && payload.tenantId) {
      // Token multi-tenant - vérifier les rôles autorisés
      if (!["OWNER", "ADMIN", "DJ", "VIEWER"].includes(payload.role)) {
        return res.status(403).json({ error: { code: "FORBIDDEN" } });
      }
      // Créer un objet staff compatible pour les routes legacy
      req.staff = {
        role: payload.role === "OWNER" ? "ADMIN" : payload.role,
        organizerId: payload.userId, // Pour compatibilité legacy
        eventCode: payload.eventCode || "",
        eventId: payload.eventId || "",
      };
      // Créer le contexte tenant pour les routes multi-tenant
      (req as any).tenant = {
        tenantId: payload.tenantId,
        userId: payload.userId,
        role: payload.role,
        email: payload.email
      };
      next();
    }

    // Support des tokens legacy (avec organizerId, role: ADMIN/DJ/DISPLAY)
    else if (["ADMIN", "DJ", "DISPLAY"].includes(payload.role)) {
      // Support DJ authentifié par PIN (authMethod: "PIN")
      if (payload.authMethod === "PIN" && payload.role === "DJ") {
        req.staff = {
          role: "DJ",
          organizerId: null, // Pas d'organizerId pour DJ PIN
          eventCode: payload.eventCode || "",
          eventId: payload.eventId || "",
          authMethod: "PIN"
        };
      } else {
        // Auth traditionnelle par email/password
        req.staff = {
          ...payload,
          authMethod: payload.authMethod || "EMAIL"
        };
      }
      next();
    } else {
      return res.status(403).json({ error: { code: "FORBIDDEN" } });
    }
  } catch {
    return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
}

export function requireRole(role: "ADMIN" | "DJ") {
  return (req: AuthedStaff, res: Response, next: NextFunction) => {
    if (!req.staff || req.staff.role !== role) {
      return res.status(403).json({ error: { code: "INSUFFICIENT_PERMISSIONS" } });
    }
    next();
  };
}

export async function requireEventAccess(
  req: AuthedStaff,
  res: Response,
  next: NextFunction,
) {
  try {
    const eventCode = req.params.eventCode || req.params.code;
    if (!eventCode) {
      return res.status(400).json({ error: { code: "EVENT_CODE_REQUIRED" } });
    }

    const event = await AppDataSource.getRepository(Event).findOne({
      where: { code: eventCode }
    });
    if (!event) {
      return res.status(404).json({ error: { code: "EVENT_NOT_FOUND" } });
    }

    // If DJ authenticated via PIN (organizerId is null), skip EventStaff check
    // PIN authentication already verified access to this specific event
    if (req.staff!.authMethod === "PIN" && req.staff!.organizerId === null) {
      // Verify the token's eventId matches the requested event
      if (req.staff!.eventId !== event.id) {
        return res.status(403).json({ error: { code: "EVENT_MISMATCH" } });
      }
    } else {
      // For email-based authentication, verify EventStaff record
      const staff = await AppDataSource.getRepository(EventStaff).findOne({
        where: {
          event_id: event.id,
          organizer_id: req.staff!.organizerId!,
          role: req.staff!.role
        }
      });

      if (!staff) {
        return res.status(403).json({ error: { code: "NO_EVENT_ACCESS" } });
      }
    }

    req.staff!.eventId = event.id;
    req.staff!.eventCode = event.code;
    next();
  } catch (error) {
    return res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
}
