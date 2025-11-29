/**
 * Impersonation - Permet au super-admin de se connecter en tant qu'une organisation
 */
import { Router } from "express";
import { AppDataSource } from "../../db/data-source";
import { Tenant } from "../../db/entities/Tenant";
import { TenantUser } from "../../db/entities/TenantUser";
import { AuditLog } from "../../db/entities/AuditLog";
import { authSuperAdmin } from "../../middlewares/super-admin-auth";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const router = Router();

/**
 * POST /api/backstage/impersonate/:tenantId
 * Génère un token temporaire pour se connecter en tant qu'une organisation
 */
router.post("/impersonate/:tenantId", authSuperAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const superAdmin = (req as any).superAdmin;

    // Vérifier que le tenant existe et est actif
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({
      where: { id: tenantId },
      relations: ["users"],
    });

    if (!tenant) {
      return res.status(404).json({
        error: "TENANT_NOT_FOUND",
        message: "Organisation introuvable",
      });
    }

    if (!tenant.is_active) {
      return res.status(403).json({
        error: "TENANT_INACTIVE",
        message: "Cette organisation est inactive",
      });
    }

    // Trouver l'utilisateur OWNER ou ADMIN du tenant
    const ownerUser = tenant.users?.find(
      (u) => u.role === "OWNER" || u.role === "ADMIN"
    );

    if (!ownerUser) {
      return res.status(404).json({
        error: "NO_ADMIN_USER",
        message: "Aucun administrateur trouvé pour cette organisation",
      });
    }

    // Générer un token d'impersonation temporaire (1 heure)
    const impersonationToken = jwt.sign(
      {
        userId: ownerUser.id,
        tenantId: tenant.id,
        email: ownerUser.email,
        role: ownerUser.role,
        impersonated: true,
        impersonatedBy: superAdmin.id,
        impersonatedAt: new Date().toISOString(),
      },
      env.JWT_SECRET,
      { expiresIn: "1h" } // Token valide 1 heure
    );

    // Logger l'action
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    await auditLogRepo.save({
      admin_id: superAdmin.id,
      action: "impersonate_tenant",
      target_type: "tenant",
      target_id: tenant.id,
      metadata_json: JSON.stringify({
        tenant_name: tenant.name,
        tenant_id: tenant.id,
        impersonated_user_email: ownerUser.email,
      }),
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.json({
      success: true,
      impersonationToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscription_plan: tenant.subscription_plan,
      },
      user: {
        id: ownerUser.id,
        email: ownerUser.email,
        role: ownerUser.role,
        display_name: ownerUser.display_name,
      },
      expiresIn: 3600, // secondes
      warning:
        "⚠️ Vous êtes en mode impersonation. Ce token expire dans 1 heure.",
    });
  } catch (error: any) {
    console.error("Impersonation error:", error);
    res.status(500).json({
      error: "IMPERSONATION_ERROR",
      message: "Erreur lors de l'impersonation",
    });
  }
});

/**
 * POST /api/backstage/exit-impersonation
 * Quitte le mode impersonation et retourne au super-admin
 */
router.post("/exit-impersonation", authSuperAdmin, async (req, res) => {
  try {
    const superAdmin = (req as any).superAdmin;

    // Logger l'action
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    await auditLogRepo.save({
      admin_id: superAdmin.id,
      action: "exit_impersonation",
      target_type: "system",
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Mode impersonation quitté",
    });
  } catch (error: any) {
    console.error("Exit impersonation error:", error);
    res.status(500).json({
      error: "EXIT_IMPERSONATION_ERROR",
      message: "Erreur lors de la sortie du mode impersonation",
    });
  }
});

export default router;
