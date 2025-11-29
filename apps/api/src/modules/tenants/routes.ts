import { Router } from "express";
import { TenantService } from "../../services/tenant.service";
import { AuthTenantService } from "../../services/auth-tenant.service";
import { tenantIsolationMiddleware, requireRole, requireSuperAdmin } from "../../middlewares/tenant-isolation";
import { emailService } from "../../services/email.service";

const router = Router();
const tenantService = new TenantService();
const authService = new AuthTenantService();

// ==================== ROUTES PUBLIQUES ====================

/**
 * POST /api/tenants/register
 * Inscription d'un nouveau tenant avec son propriétaire
 */
router.post("/tenants/register", async (req, res) => {
  try {
    const { name, slug, ownerEmail, ownerPassword, ownerName, plan } = req.body;

    if (!name || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "Name, email and password required" }
      });
    }

    const result = await tenantService.createTenant({
      name,
      slug,
      ownerEmail,
      ownerPassword,
      ownerName,
      plan: plan || 'TRIAL'
    });

    // Générer le token pour le propriétaire
    const token = authService.generateAccessToken(result.owner, result.tenant);

    // Envoyer l'email de bienvenue avec les informations d'inscription
    try {
      await emailService.sendRegistrationConfirmationEmail(
        result.owner.email,
        result.owner.getFullName(),
        result.tenant.subscription_plan
      );
    } catch (emailError) {
      console.error('Failed to send registration confirmation email:', emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    return res.status(201).json({
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.subscription_plan,
        expiresAt: result.tenant.subscription_expires_at
      },
      user: {
        id: result.owner.id,
        email: result.owner.email,
        role: result.owner.role,
        displayName: result.owner.display_name
      },
      token
    });
  } catch (error: any) {
    if (error.message === "SLUG_ALREADY_EXISTS") {
      return res.status(409).json({
        error: { code: "SLUG_ALREADY_EXISTS", message: "This name is already taken" }
      });
    }

    console.error("Tenant registration error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Registration failed" }
    });
  }
});

/**
 * POST /api/tenants/login
 * Connexion utilisateur multi-tenant
 */
router.post("/tenants/login", async (req, res) => {
  try {
    const { email, password, tenantSlug, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "Email and password required" }
      });
    }

    // Utiliser 'default' comme tenant par défaut si aucun slug ou ID n'est fourni
    const finalTenantSlug = tenantSlug || (tenantId ? undefined : 'default');

    const result = await authService.login(email, password, finalTenantSlug, tenantId);

    return res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        displayName: result.user.getFullName()
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.subscription_plan
      },
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error: any) {
    const errorCodes = {
      TENANT_NOT_FOUND: { status: 404, code: "TENANT_NOT_FOUND" },
      TENANT_SUSPENDED: { status: 403, code: "TENANT_SUSPENDED" },
      INVALID_CREDENTIALS: { status: 401, code: "INVALID_CREDENTIALS" },
      SUBSCRIPTION_EXPIRED: { status: 403, code: "SUBSCRIPTION_EXPIRED" }
    };

    const errorInfo = errorCodes[error.message as keyof typeof errorCodes];
    if (errorInfo) {
      return res.status(errorInfo.status).json({
        error: { code: errorInfo.code, message: error.message }
      });
    }

    console.error("Login error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Login failed" }
    });
  }
});

/**
 * POST /api/tenants/refresh-token
 * Rafraîchir un token d'accès
 */
router.post("/tenants/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: { code: "REFRESH_TOKEN_REQUIRED" }
      });
    }

    const result = await authService.refreshToken(refreshToken);

    return res.json(result);
  } catch (error) {
    return res.status(401).json({
      error: { code: "INVALID_REFRESH_TOKEN" }
    });
  }
});

/**
 * GET /api/tenants/check-slug/:slug
 * Vérifier la disponibilité d'un slug
 */
router.get("/tenants/check-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await tenantService.getTenantBySlug(slug);

    return res.json({
      available: !tenant,
      slug
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

// ==================== ROUTES PROTÉGÉES ====================
// Toutes les routes ci-dessous nécessitent une authentification

// DÉSACTIVÉ : Le middleware global cause des conflits avec les routes legacy
// TODO: Refactoriser pour séparer les routes publiques/protégées dans des routers distincts
// router.use(tenantIsolationMiddleware);

/**
 * GET /api/tenants/current
 * Informations sur le tenant actuel
 */
router.get("/tenants/current", tenantIsolationMiddleware, async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.tenantId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Tenant authentication required" }
      });
    }

    const tenantId = req.tenant.tenantId;
    const tenant = await tenantService.getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND" }
      });
    }

    const usage = await tenantService.getTenantUsage(tenantId);

    return res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.subscription_plan,
        status: tenant.subscription_status,
        expiresAt: tenant.subscription_expires_at,
        limits: {
          maxEvents: tenant.max_concurrent_events,
          maxPlayersPerEvent: tenant.max_players_per_event,
          maxUsers: tenant.max_users
        }
      },
      usage
    });
  } catch (error) {
    console.error("Get current tenant error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

/**
 * PUT /api/tenants/current
 * Mettre à jour le tenant actuel
 */
router.put("/tenants/current", tenantIsolationMiddleware, requireRole(['OWNER']), async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.tenantId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Tenant authentication required" }
      });
    }

    const tenantId = req.tenant.tenantId;
    const { name } = req.body;

    const tenant = await tenantService.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND" }
      });
    }

    if (name) tenant.name = name;

    // TODO: Sauvegarder les changements
    // await tenantService.updateTenant(tenant);

    return res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      }
    });
  } catch (error) {
    console.error("Update tenant error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

/**
 * GET /api/tenants/users
 * Liste des utilisateurs du tenant
 */
router.get("/tenants/users", tenantIsolationMiddleware, requireRole(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.tenantId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Tenant authentication required" }
      });
    }

    const tenantId = req.tenant.tenantId;
    const users = await authService.getTenantUsers(tenantId);

    return res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.getFullName(),
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error("Get tenant users error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

/**
 * POST /api/tenants/users
 * Créer un nouvel utilisateur
 */
router.post("/tenants/users", tenantIsolationMiddleware, requireRole(['OWNER']), async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.tenantId || !req.tenant.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Tenant authentication required" }
      });
    }

    const tenantId = req.tenant.tenantId;
    const currentUser = await authService.getUserById(req.tenant.userId, tenantId);

    if (!currentUser) {
      return res.status(401).json({
        error: { code: "INVALID_USER" }
      });
    }

    const { email, password, role, displayName, firstName, lastName } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "Email, password and role required" }
      });
    }

    const user = await authService.createUser(
      tenantId,
      { email, password, role, displayName, firstName, lastName },
      currentUser
    );

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.getFullName(),
        isActive: user.is_active
      }
    });
  } catch (error: any) {
    const errorCodes = {
      EMAIL_ALREADY_EXISTS: { status: 409, code: "EMAIL_ALREADY_EXISTS" },
      USER_LIMIT_REACHED: { status: 403, code: "USER_LIMIT_REACHED" },
      INSUFFICIENT_PERMISSIONS: { status: 403, code: "INSUFFICIENT_PERMISSIONS" }
    };

    const errorInfo = errorCodes[error.message as keyof typeof errorCodes];
    if (errorInfo) {
      return res.status(errorInfo.status).json({
        error: { code: errorInfo.code }
      });
    }

    console.error("Create user error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

/**
 * PUT /api/tenants/users/:userId
 * Mettre à jour un utilisateur
 */
router.put("/tenants/users/:userId", tenantIsolationMiddleware, async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.tenantId || !req.tenant.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Tenant authentication required" }
      });
    }

    const tenantId = req.tenant.tenantId;
    const { userId } = req.params;
    const currentUser = await authService.getUserById(req.tenant.userId, tenantId);

    if (!currentUser) {
      return res.status(401).json({
        error: { code: "INVALID_USER" }
      });
    }

    const updates = req.body;
    const user = await authService.updateUser(userId, updates, currentUser);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.getFullName(),
        isActive: user.is_active
      }
    });
  } catch (error: any) {
    const errorCodes = {
      USER_NOT_FOUND: { status: 404, code: "USER_NOT_FOUND" },
      INSUFFICIENT_PERMISSIONS: { status: 403, code: "INSUFFICIENT_PERMISSIONS" },
      CANNOT_MODIFY_OWNER: { status: 403, code: "CANNOT_MODIFY_OWNER" }
    };

    const errorInfo = errorCodes[error.message as keyof typeof errorCodes];
    if (errorInfo) {
      return res.status(errorInfo.status).json({
        error: { code: errorInfo.code }
      });
    }

    console.error("Update user error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

/**
 * DELETE /api/tenants/users/:userId
 * Supprimer un utilisateur
 */
router.delete("/tenants/users/:userId", tenantIsolationMiddleware, requireRole(['OWNER']), async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.tenantId || !req.tenant.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Tenant authentication required" }
      });
    }

    const tenantId = req.tenant.tenantId;
    const { userId } = req.params;
    const currentUser = await authService.getUserById(req.tenant.userId, tenantId);

    if (!currentUser) {
      return res.status(401).json({
        error: { code: "INVALID_USER" }
      });
    }

    await authService.deleteUser(userId, currentUser);

    return res.status(204).send();
  } catch (error: any) {
    const errorCodes = {
      USER_NOT_FOUND: { status: 404, code: "USER_NOT_FOUND" },
      INSUFFICIENT_PERMISSIONS: { status: 403, code: "INSUFFICIENT_PERMISSIONS" },
      CANNOT_DELETE_OWNER: { status: 403, code: "CANNOT_DELETE_OWNER" }
    };

    const errorInfo = errorCodes[error.message as keyof typeof errorCodes];
    if (errorInfo) {
      return res.status(errorInfo.status).json({
        error: { code: errorInfo.code }
      });
    }

    console.error("Delete user error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

// ==================== ROUTES SUPER ADMIN ====================

/**
 * GET /api/tenants/admin/all
 * Liste de tous les tenants (super admin seulement)
 */
router.get("/tenants/admin/all", requireSuperAdmin, async (req, res) => {
  try {
    // TODO: Implémenter la liste complète des tenants pour super admin
    return res.json({
      tenants: [],
      message: "Super admin access - feature to implement"
    });
  } catch (error) {
    console.error("Admin get all tenants error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" }
    });
  }
});

export default router;