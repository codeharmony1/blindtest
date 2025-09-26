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
    organizerId: string;
    eventCode: string;
    eventId: string;
  };
}

export function requirePlayer(
  req: AuthedPlayer,
  res: Response,
  next: NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (payload.role !== "PLAYER")
      return res.status(403).json({ error: { code: "FORBIDDEN" } });
    req.player = payload;
    next();
  } catch {
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
    if (!["ADMIN", "DJ", "DISPLAY"].includes(payload.role))
      return res.status(403).json({ error: { code: "FORBIDDEN" } });
    req.staff = payload;
    next();
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

    const staff = await AppDataSource.getRepository(EventStaff).findOne({
      where: {
        event_id: event.id,
        organizer_id: req.staff!.organizerId,
        role: req.staff!.role
      }
    });

    if (!staff) {
      return res.status(403).json({ error: { code: "NO_EVENT_ACCESS" } });
    }

    req.staff!.eventId = event.id;
    req.staff!.eventCode = event.code;
    next();
  } catch (error) {
    return res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
}
