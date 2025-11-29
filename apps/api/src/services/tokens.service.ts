import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Durées de validité des tokens
const ACCESS_TOKEN_EXPIRY = env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRY = env.JWT_REFRESH_EXPIRES_IN || "7d";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Émettre un token access pour un joueur
 */
export function issuePlayerToken(
  eventCode: string,
  teamId: string,
  playerId: string,
) {
  return jwt.sign(
    { role: "PLAYER", eventCode, teamId, playerId },
    env.JWT_SECRET,
    { expiresIn: "8h" }, // Tokens joueurs plus longs (durée d'un événement)
  );
}

/**
 * Émettre un token access pour un staff (ADMIN/DJ/DISPLAY)
 */
export function issueStaffToken(
  role: "ADMIN" | "DJ" | "DISPLAY",
  organizerId: string,
  eventCode: string,
) {
  return jwt.sign(
    { role, organizerId, eventCode },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions,
  );
}

/**
 * Émettre un token access pour un DJ authentifié par PIN
 */
export function issueDJToken(
  eventCode: string,
  eventId: string,
): string {
  return jwt.sign(
    {
      role: "DJ",
      eventCode,
      eventId,
      authMethod: "PIN" // Marqueur pour distinguer l'auth par PIN
    },
    env.JWT_SECRET,
    { expiresIn: "8h" }, // Durée typique d'un événement
  );
}

/**
 * Émettre une paire access + refresh tokens pour un organisateur
 */
export function issueOrganizerTokenPair(
  organizerId: string,
  email: string,
  role: "ADMIN" | "DJ" | "DISPLAY" = "ADMIN",
  eventCode: string = ""
): TokenPair {
  const accessToken = jwt.sign(
    { role, organizerId, eventCode, email },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { organizerId, email, type: "refresh" },
    env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * Émettre une paire access + refresh tokens pour un tenant user
 */
export function issueTenantUserTokenPair(
  userId: string,
  tenantId: string,
  email: string,
  role: string
): TokenPair {
  const accessToken = jwt.sign(
    { userId, tenantId, email, role },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, tenantId, email, type: "refresh" },
    env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * Vérifier et décoder un token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Vérifier qu'un token est un refresh token valide
 */
export function verifyRefreshToken(refreshToken: string): any {
  const decoded = verifyToken(refreshToken);

  if (!decoded || decoded.type !== "refresh") {
    return null;
  }

  return decoded;
}
