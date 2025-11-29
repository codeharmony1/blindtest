import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Interface pour le contexte tenant dans la requête
export interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  eventCode?: string;
}

// Étendre l'interface Request pour inclure le contexte tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      isSuperAdmin?: boolean;
    }
  }
}

/**
 * Middleware d'isolation tenant
 * S'assure que chaque requête ne peut accéder qu'aux données de son tenant
 */
export const tenantIsolationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Exclure certaines routes qui n'ont pas besoin d'isolation tenant
    const excludedPaths = [
      "/api/health",
      "/api/auth/register",
      "/api/tenants/register", // Nouvelle route d'inscription tenant
      "/api/pricing",
      "/api/webhooks/stripe",
      "/api/super-admin", // Routes super admin
    ];

    // Routes publiques des joueurs (utilise le code événement pour identifier le tenant)
    // Ces routes utilisent le code événement dans l'URL pour extraire le tenant
    const publicPlayerRoutes = [
      /^\/api\/events\/[^/]+\/public$/,        // GET /api/events/:code/public
      /^\/api\/events\/[^/]+\/teams$/,         // GET/POST /api/events/:code/teams
      /^\/api\/events\/[^/]+\/join$/,          // POST /api/events/:code/join
      /^\/api\/events\/[^/]+\/players$/,       // GET /api/events/:code/players
      /^\/api\/events\/[^/]+\/leaderboard$/,   // GET /api/events/:code/leaderboard
    ];

    const path = req.path;
    console.log("🔐 tenantIsolationMiddleware - path:", path, "| Full URL:", req.originalUrl);

    // Passer les routes exclues
    if (excludedPaths.some((excluded) => path.startsWith(excluded))) {
      console.log("✅ Path excluded from tenant isolation");
      return next();
    }

    // Pour les routes joueurs publiques (avec code événement), pas besoin d'auth
    if (publicPlayerRoutes.some((pattern) => pattern.test(path))) {
      console.log("✅ Public player route detected, using handlePlayerAccess");
      return handlePlayerAccess(req, res, next);
    }

    // Extraire le token d'authentification
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Vérifier qu'un token est présent
    if (!token) {
      return res.status(401).json({
        error: {
          code: "TOKEN_REQUIRED",
          message: "Authentication token required",
        },
      });
    }

    // Décoder et vérifier le token
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Vérifier si c'est un super admin
    if (decoded.role === "SUPER_ADMIN") {
      req.isSuperAdmin = true;
      // Super admin peut accéder à tout, on passe au middleware suivant
      return next();
    }

    // Support des tokens legacy (organizerId) et nouveaux (tenantId)
    if (decoded.tenantId) {
      // Nouveau système multi-tenant
      req.tenant = {
        tenantId: decoded.tenantId,
        userId: decoded.userId,
        userRole: decoded.role,
        sessionId: decoded.sessionId,
        eventCode: decoded.eventCode,
      };
    } else if (decoded.organizerId) {
      // Ancien système legacy - on passe sans créer de contexte tenant
      // Le middleware requireStaff gérera l'authentification legacy
      return next();
    } else {
      // Token invalide (ni tenantId ni organizerId)
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Token missing authentication information",
        },
      });
    }

    // Valider l'accès tenant pour cette route
    if (!validateTenantAccess(req)) {
      return res.status(403).json({
        error: {
          code: "TENANT_ACCESS_DENIED",
          message: "Access denied for this tenant",
        },
      });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      });
    }

    console.error("Tenant isolation middleware error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

/**
 * Gérer l'accès des joueurs via le code événement
 */
async function handlePlayerAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Extraire le code événement de l'URL (/api/events/:code/...)
    let eventCode = req.params.eventCode || req.params.code;

    // Si pas dans les params, essayer dans le body/query
    if (!eventCode) {
      eventCode = req.body?.eventCode || req.query?.eventCode;
    }

    // Si toujours pas trouvé, extraire de l'URL avec regex
    if (!eventCode) {
      const match = req.path.match(/\/api\/events\/([^/]+)/);
      if (match) {
        eventCode = match[1];
      }
    }

    if (!eventCode) {
      return res.status(400).json({
        error: { code: "EVENT_CODE_REQUIRED", message: "Event code required" },
      });
    }

    // TODO: Récupérer le tenant_id depuis l'événement
    // Pour l'instant, on utilise le tenant par défaut
    req.tenant = {
      tenantId: "00000000-0000-0000-0000-000000000001", // Tenant par défaut
      eventCode: eventCode as string,
    };

    next();
  } catch (error) {
    console.error("Player access error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
}

/**
 * Valider que l'utilisateur a accès aux ressources de ce tenant
 */
function validateTenantAccess(req: Request): boolean {
  const tenant = req.tenant;
  const path = req.path;

  if (!tenant) return false;

  // Les utilisateurs peuvent seulement accéder aux ressources de leur tenant

  // Routes d'événements générales (/api/events sans code spécifique)
  // Autorisé si l'utilisateur a un userId (authentifié)
  if (path === "/events" || path === "/events/") {
    return !!tenant.userId && !!tenant.tenantId;
  }

  // Routes d'événements spécifiques avec code (/api/events/:code)
  if (path.includes("/events/") && req.params.eventCode) {
    // TODO: Vérifier en base que l'événement appartient au tenant
    // Pour l'instant, on fait confiance au token
    return tenant.eventCode === req.params.eventCode || !!tenant.userId;
  }

  // Par défaut, autoriser l'accès si l'utilisateur a un tenantId
  return !!tenant.tenantId;
}

/**
 * Middleware pour vérifier les permissions spécifiques
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isSuperAdmin) {
      return next(); // Super admin bypass toutes les restrictions
    }

    const userRole = req.tenant?.userRole;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions",
        },
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier l'accès super admin
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("🔐 requireSuperAdmin called for:", req.method, req.path);

    // Extraire le token
    const authHeader = req.headers.authorization;
    console.log(
      "🔐 requireSuperAdmin - Authorization header:",
      authHeader ? authHeader.substring(0, 20) + "..." : "MISSING",
    );

    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("⚠️ No Bearer token found");
      return res.status(401).json({
        error: {
          code: "TOKEN_REQUIRED",
          message: "Authentication token required",
        },
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    console.log("✅ Token decoded:", {
      role: decoded.role,
      id: decoded.id,
      email: decoded.email,
    });

    // Vérifier que c'est un super-admin
    if (decoded.role !== "SUPER_ADMIN") {
      console.warn("⚠️ Token is valid but role is not SUPER_ADMIN");
      return res.status(403).json({
        error: {
          code: "SUPER_ADMIN_REQUIRED",
          message: "Super admin access required",
        },
      });
    }

    // Injecter les infos dans la requête
    req.isSuperAdmin = true;
    (req as any).adminId = decoded.id;
    (req as any).adminEmail = decoded.email;

    console.log("✅ Super-admin access granted for", decoded.email);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("❌ JWT verification failed:", error.message);
      return res.status(401).json({
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      });
    }

    console.error("requireSuperAdmin middleware error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

/**
 * Helper pour ajouter automatiquement tenant_id aux requêtes
 */
export const addTenantFilter = (query: any, req: Request): any => {
  if (req.isSuperAdmin) {
    // Super admin peut voir toutes les données
    return query;
  }

  if (req.tenant?.tenantId) {
    return {
      ...query,
      tenant_id: req.tenant.tenantId,
    };
  }

  throw new Error("No tenant context available");
};

/**
 * Helper pour créer des entités avec tenant_id automatique
 */
export const addTenantData = (data: any, req: Request): any => {
  if (req.isSuperAdmin && data.tenant_id) {
    // Super admin peut spécifier le tenant explicitement
    return data;
  }

  if (req.tenant?.tenantId) {
    return {
      ...data,
      tenant_id: req.tenant.tenantId,
    };
  }

  throw new Error("No tenant context available");
};
