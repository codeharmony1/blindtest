import { Router, Request, Response } from "express";
import { SuperAdminService } from "../../services/super-admin.service";
import { requireSuperAdmin } from "../../middlewares/tenant-isolation";
import impersonationRouter from "./impersonation";

const router = Router();
const service = new SuperAdminService();

/**
 * POST /api/backstage/auth/login
 * Authentification super-admin
 */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "Email and password required" },
      });
    }

    const ipAddress = req.ip || req.headers["x-forwarded-for"] as string;
    const userAgent = req.headers["user-agent"];

    const result = await service.authenticate(email, password, ipAddress, userAgent);

    res.json({
      token: result.token,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        lastLoginAt: result.admin.last_login_at,
      },
    });
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
      });
    }

    console.error("Super-admin login error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

// Impersonation routes (doivent être montées AVANT requireSuperAdmin car elles utilisent leur propre middleware)
router.use(impersonationRouter);

// Toutes les routes suivantes nécessitent l'authentification super-admin
router.use(requireSuperAdmin);

/**
 * GET /api/backstage/stats
 * Statistiques globales
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await service.getGlobalStats();
    res.json(stats);
  } catch (error) {
    console.error("Get global stats error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * GET /api/backstage/tenants
 * Liste de tous les tenants
 */
router.get("/tenants", async (req: Request, res: Response) => {
  try {
    const { status, plan, search } = req.query;

    const tenants = await service.getAllTenants({
      status: status as string,
      plan: plan as string,
      search: search as string,
    });

    res.json(tenants);
  } catch (error) {
    console.error("Get tenants error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * GET /api/backstage/tenants/:id
 * Détails d'un tenant
 */
router.get("/tenants/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await service.getTenantDetails(id);
    res.json(tenant);
  } catch (error: any) {
    if (error.message === "TENANT_NOT_FOUND") {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
      });
    }

    console.error("Get tenant details error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * PUT /api/backstage/tenants/:id/suspend
 * Suspendre un tenant
 */
router.put("/tenants/:id/suspend", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).adminId; // Injecté par requireSuperAdmin
    const ipAddress = req.ip || req.headers["x-forwarded-for"] as string;
    const userAgent = req.headers["user-agent"];

    const tenant = await service.suspendTenant(
      id,
      adminId,
      reason,
      ipAddress,
      userAgent
    );

    res.json({ success: true, tenant });
  } catch (error: any) {
    if (error.message === "TENANT_NOT_FOUND") {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
      });
    }

    console.error("Suspend tenant error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * PUT /api/backstage/tenants/:id/reactivate
 * Réactiver un tenant
 */
router.put("/tenants/:id/reactivate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] as string;
    const userAgent = req.headers["user-agent"];

    const tenant = await service.reactivateTenant(
      id,
      adminId,
      ipAddress,
      userAgent
    );

    res.json({ success: true, tenant });
  } catch (error: any) {
    if (error.message === "TENANT_NOT_FOUND") {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
      });
    }

    console.error("Reactivate tenant error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * PUT /api/backstage/tenants/:id/plan
 * Mettre à jour le plan d'un tenant
 */
router.put("/tenants/:id/plan", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    const adminId = (req as any).adminId;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] as string;
    const userAgent = req.headers["user-agent"];

    if (!["DEMO", "PER_EVENT", "MONTHLY"].includes(plan)) {
      return res.status(400).json({
        error: { code: "INVALID_PLAN", message: "Invalid plan type" },
      });
    }

    const tenant = await service.updateTenantPlan(
      id,
      plan,
      adminId,
      ipAddress,
      userAgent
    );

    res.json({ success: true, tenant });
  } catch (error: any) {
    if (error.message === "TENANT_NOT_FOUND") {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
      });
    }

    console.error("Update tenant plan error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * DELETE /api/backstage/tenants/:id
 * Supprimer un tenant (avec confirmation)
 */
router.delete("/tenants/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.body;
    const adminId = (req as any).adminId;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] as string;
    const userAgent = req.headers["user-agent"];

    await service.deleteTenant(
      id,
      adminId,
      confirmation,
      ipAddress,
      userAgent
    );

    res.json({ success: true, message: "Tenant deleted successfully" });
  } catch (error: any) {
    if (error.message === "TENANT_NOT_FOUND") {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
      });
    }

    if (error.message === "CONFIRMATION_REQUIRED") {
      return res.status(400).json({
        error: { code: "CONFIRMATION_REQUIRED", message: "Confirmation required" },
      });
    }

    console.error("Delete tenant error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * GET /api/backstage/events/live
 * Événements en cours (tous tenants)
 */
router.get("/events/live", async (req: Request, res: Response) => {
  try {
    const liveEvents = await service.getLiveEvents();
    res.json(liveEvents);
  } catch (error) {
    console.error("Get live events error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

/**
 * POST /api/backstage/events/:eventId/force-stop
 * Arrêter un événement de force (super-admin uniquement)
 */
router.post("/events/:eventId/force-stop", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;
    const superAdmin = (req as any).superAdmin;

    await service.forceStopEvent(eventId, superAdmin?.id, reason);

    res.json({
      success: true,
      message: "Événement arrêté avec succès",
      eventId,
    });
  } catch (error: any) {
    console.error("Force stop event error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message || "Internal server error" },
    });
  }
});

/**
 * GET /api/backstage/audit-logs
 * Logs d'audit
 */
router.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const { adminId, action, targetType, startDate, endDate, limit } = req.query;

    const logs = await service.getAuditLogs({
      adminId: adminId as string,
      action: action as any,
      targetType: targetType as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
});

export default router;
