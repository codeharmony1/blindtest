import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppDataSource } from "../db/data-source";
import { SuperAdmin } from "../db/entities/SuperAdmin";

export interface AuthedSuperAdmin extends Request {
  superAdmin?: {
    id: string;
    email: string;
    role: "SUPER_ADMIN";
  };
}

/**
 * Middleware d'authentification pour les super-admins
 */
export async function authSuperAdmin(
  req: AuthedSuperAdmin,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = req.headers.authorization;
    console.log("🔐 authSuperAdmin - Authorization header:", auth ? "PRESENT" : "MISSING");

    if (!auth?.startsWith("Bearer ")) {
      console.warn("⚠️ No Bearer token found in authSuperAdmin");
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token d'authentification manquant",
      });
    }

    const token = auth.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    console.log("✅ Token decoded in authSuperAdmin:", { role: payload.role, id: payload.id });

    // Vérifier que c'est bien un token super-admin
    if (payload.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Accès réservé aux super-admins",
      });
    }

    // Vérifier que le super-admin existe toujours en base
    const superAdminRepo = AppDataSource.getRepository(SuperAdmin);
    const superAdmin = await superAdminRepo.findOne({
      where: { id: payload.id },
    });

    if (!superAdmin) {
      return res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Super-admin introuvable",
      });
    }

    if (!superAdmin.is_active) {
      return res.status(403).json({
        error: "ACCOUNT_DISABLED",
        message: "Compte super-admin désactivé",
      });
    }

    // Attacher les infos du super-admin à la requête
    req.superAdmin = {
      id: superAdmin.id,
      email: superAdmin.email,
      role: "SUPER_ADMIN",
    };

    // Aussi attacher pour compatibilité avec d'autres middlewares
    (req as any).isSuperAdmin = true;
    (req as any).adminId = superAdmin.id;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Token expiré",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Token invalide",
      });
    }

    console.error("Super-admin auth error:", error);
    return res.status(500).json({
      error: "AUTH_ERROR",
      message: "Erreur d'authentification",
    });
  }
}
