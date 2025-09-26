import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function issuePlayerToken(
  eventCode: string,
  teamId: string,
  playerId: string,
) {
  return jwt.sign(
    { role: "PLAYER", eventCode, teamId, playerId },
    env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

export function issueStaffToken(
  role: "ADMIN" | "DJ" | "DISPLAY",
  organizerId: string,
  eventCode: string,
) {
  return jwt.sign(
    { role, organizerId, eventCode },
    env.JWT_SECRET,
    { expiresIn: "24h" },
  );
}
