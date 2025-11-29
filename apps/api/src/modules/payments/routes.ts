import { Router } from "express";
import { StripeService } from "../../services/stripe.service";
import { TenantService } from "../../services/tenant.service";
import {
  tenantIsolationMiddleware,
  requireRole,
} from "../../middlewares/tenant-isolation";
import { env } from "../../config/env";

const router = Router();
let stripeService: StripeService | null = null;
const tenantService = new TenantService();

function ensureStripeService(): StripeService {
  if (!env.STRIPE_SECRET_KEY) {
    const e: any = new Error("STRIPE_NOT_CONFIGURED");
    e.status = 503;
    throw e;
  }
  if (!stripeService) {
    stripeService = new StripeService(env.STRIPE_SECRET_KEY);
  }
  return stripeService;
}

// ==================== ROUTES PUBLIQUES ====================

/**
 * GET /api/payments/pricing
 * Informations sur les plans et tarifs
 */
router.get("/payments/pricing", async (req, res) => {
  try {
    const pricing = {
      subscriptions: {
        DEMO: {
          name: "Plan DÉMO",
          price: 0,
          currency: "EUR",
          interval: "perpetual",
          features: [
            "Événements illimités",
            "Joueurs illimités",
            "⚠️ Limité à 5 chansons par événement",
            "Gratuit à vie",
          ],
        },
        PER_EVENT: {
          name: "Paiement par Événement",
          price: 19,
          currency: "EUR",
          interval: "one_time",
          features: [
            "1 événement à la fois",
            "Chansons illimitées",
            "Joueurs illimités",
            "Support par email",
          ],
        },
        MONTHLY: {
          name: "Plan Mensuel",
          price: 49,
          currency: "EUR",
          interval: "month",
          features: [
            "Événements illimités",
            "Chansons illimitées",
            "Joueurs illimités",
            "Support prioritaire",
          ],
        },
      },
      temporarySessions: {
        "2days": {
          name: "2 jours",
          price: 19,
          currency: "EUR",
          duration: "2 jours",
          features: [
            "Événements illimités pendant 2 jours",
            "100 joueurs maximum par événement",
            "Support par email",
          ],
        },
        "1week": {
          name: "1 semaine",
          price: 49,
          currency: "EUR",
          duration: "7 jours",
          features: [
            "Événements illimités pendant 1 semaine",
            "200 joueurs maximum par événement",
            "Support par email",
          ],
        },
        "1month": {
          name: "1 mois",
          price: 99,
          currency: "EUR",
          duration: "30 jours",
          features: [
            "Événements illimités pendant 1 mois",
            "500 joueurs maximum par événement",
            "Support prioritaire",
          ],
        },
      },
    };

    return res.json(pricing);
  } catch (error) {
    console.error("Get pricing error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" },
    });
  }
});

/**
 * POST /api/payments/webhooks/stripe
 * Webhook Stripe pour traiter les événements de paiement
 */
router.post("/payments/webhooks/stripe", async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    const svc = ensureStripeService();
    await svc.handleWebhook(req.body, signature, webhookSecret);

    return res.status(200).send("OK");
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ==================== ROUTES PROTÉGÉES ====================
// Toutes les routes ci-dessous nécessitent une authentification

// DÉSACTIVÉ : Le middleware global cause des conflits avec les routes legacy
// TODO: Refactoriser pour séparer les routes publiques/protégées dans des routers distincts
// router.use(tenantIsolationMiddleware);

/**
 * POST /api/payments/checkout/subscription
 * Créer une session de checkout pour un abonnement
 */
router.post(
  "/payments/checkout/subscription",
  tenantIsolationMiddleware,
  requireRole(["OWNER"]),
  async (req, res) => {
    try {
      if (!req.tenant || !req.tenant.tenantId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Tenant authentication required",
          },
        });
      }

      const tenantId = req.tenant.tenantId;
      const { plan, successUrl, cancelUrl } = req.body;

      if (!plan || !["PER_EVENT", "MONTHLY"].includes(plan)) {
        return res.status(400).json({
          error: {
            code: "INVALID_PLAN",
            message: "Valid plan required (PER_EVENT or MONTHLY)",
          },
        });
      }

      if (!successUrl || !cancelUrl) {
        return res.status(400).json({
          error: {
            code: "URLS_REQUIRED",
            message: "Success and cancel URLs required",
          },
        });
      }

      const svc = ensureStripeService();
      const session = await svc.createSubscriptionCheckout(
        tenantId,
        plan,
        successUrl,
        cancelUrl,
      );

      return res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      if (error?.message === "STRIPE_NOT_CONFIGURED" || error?.status === 503) {
        return res.status(503).json({
          error: {
            code: "STRIPE_NOT_CONFIGURED",
            message: "Stripe is not configured on this server",
          },
        });
      }
      if (error.message === "TENANT_NOT_FOUND") {
        return res.status(404).json({
          error: { code: "TENANT_NOT_FOUND", message: "Tenant not found" },
        });
      }

      if (error.message === "SUBSCRIPTION_ALREADY_EXISTS") {
        return res.status(409).json({
          error: {
            code: "SUBSCRIPTION_ALREADY_EXISTS",
            message: "You already have an active subscription for this plan",
          },
        });
      }

      console.error("Create subscription checkout error:", error);
      return res.status(500).json({
        error: {
          code: "SERVER_ERROR",
          message: "Failed to create checkout session",
        },
      });
    }
  },
);

/**
 * POST /api/payments/checkout/session
 * Créer une session de checkout pour une session temporaire
 */
router.post(
  "/payments/checkout/session",
  tenantIsolationMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      if (!req.tenant || !req.tenant.tenantId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Tenant authentication required",
          },
        });
      }

      const tenantId = req.tenant.tenantId;
      const { sessionType, sessionName, successUrl, cancelUrl } = req.body;

      if (!sessionType || !["2days", "1week", "1month"].includes(sessionType)) {
        return res.status(400).json({
          error: {
            code: "INVALID_SESSION_TYPE",
            message: "Valid session type required",
          },
        });
      }

      if (!sessionName) {
        return res.status(400).json({
          error: {
            code: "SESSION_NAME_REQUIRED",
            message: "Session name required",
          },
        });
      }

      if (!successUrl || !cancelUrl) {
        return res.status(400).json({
          error: {
            code: "URLS_REQUIRED",
            message: "Success and cancel URLs required",
          },
        });
      }

      const svc = ensureStripeService();
      const result = await svc.createTemporarySessionCheckout(
        tenantId,
        sessionType,
        sessionName,
        successUrl,
        cancelUrl,
      );

      return res.json({
        checkoutUrl: result.checkoutSession.url,
        sessionId: result.checkoutSession.id,
        tenantSessionId: result.tenantSession.id,
      });
    } catch (error: any) {
      if (error.message === "TENANT_NOT_FOUND") {
        return res.status(404).json({
          error: { code: "TENANT_NOT_FOUND" },
        });
      }

      console.error("Create session checkout error:", error);
      return res.status(500).json({
        error: {
          code: "SERVER_ERROR",
          message: "Failed to create checkout session",
        },
      });
    }
  },
);

/**
 * POST /api/payments/portal
 * Créer une session du portail client Stripe
 */
router.post(
  "/payments/portal",
  tenantIsolationMiddleware,
  requireRole(["OWNER"]),
  async (req, res) => {
    try {
      if (!req.tenant || !req.tenant.tenantId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Tenant authentication required",
          },
        });
      }

      const tenantId = req.tenant.tenantId;
      const { returnUrl } = req.body;

      if (!returnUrl) {
        return res.status(400).json({
          error: {
            code: "RETURN_URL_REQUIRED",
            message: "Return URL required",
          },
        });
      }

      const svc = ensureStripeService();
      const session = await svc.createCustomerPortalSession(
        tenantId,
        returnUrl,
      );

      return res.json({
        portalUrl: session.url,
      });
    } catch (error: any) {
      if (error.message === "STRIPE_CUSTOMER_NOT_FOUND") {
        return res.status(404).json({
          error: { code: "NO_CUSTOMER", message: "No Stripe customer found" },
        });
      }

      console.error("Create portal session error:", error);
      return res.status(500).json({
        error: {
          code: "SERVER_ERROR",
          message: "Failed to create portal session",
        },
      });
    }
  },
);

/**
 * GET /api/payments/history
 * Historique des paiements du tenant
 */
router.get(
  "/payments/history",
  tenantIsolationMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      if (!req.tenant || !req.tenant.tenantId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Tenant authentication required",
          },
        });
      }

      const tenantId = req.tenant.tenantId;
      const svc = ensureStripeService();
      const payments = await svc.getTenantPayments(tenantId);

      const paymentHistory = payments.map((payment) => ({
        id: payment.id,
        type: payment.payment_type,
        status: payment.status,
        amount: payment.getTotalAmount(),
        currency: payment.currency,
        description: payment.description,
        createdAt: payment.created_at,
        paidAt: payment.paid_at,
      }));

      return res.json({
        payments: paymentHistory,
      });
    } catch (error) {
      console.error("Get payment history error:", error);
      return res.status(500).json({
        error: { code: "SERVER_ERROR" },
      });
    }
  },
);

/**
 * GET /api/payments/sessions
 * Sessions actives du tenant
 */
router.get(
  "/payments/sessions",
  tenantIsolationMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.tenant!.tenantId;
      const sessions = await tenantService.getActiveSessions(tenantId);

      const sessionList = sessions.map((session) => ({
        id: session.id,
        name: session.name,
        description: session.description,
        durationDays: session.duration_days,
        startsAt: session.starts_at,
        expiresAt: session.expires_at,
        isActive: session.isActive(),
        daysRemaining: session.getDaysRemaining(),
        usage: session.getUsageStats(),
        limits: {
          maxEvents: session.max_events,
          maxPlayersPerEvent: session.max_players_per_event,
          maxTotalPlayers: session.max_total_players,
        },
      }));

      return res.json({
        sessions: sessionList,
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      return res.status(500).json({
        error: { code: "SERVER_ERROR" },
      });
    }
  },
);

/**
 * POST /api/payments/subscription/cancel
 * Annuler l'abonnement
 */
router.post(
  "/payments/subscription/cancel",
  tenantIsolationMiddleware,
  requireRole(["OWNER"]),
  async (req, res) => {
    try {
      if (!req.tenant || !req.tenant.tenantId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Tenant authentication required",
          },
        });
      }

      const tenantId = req.tenant.tenantId;

      const svc = ensureStripeService();
      await svc.cancelSubscription(tenantId);

      return res.json({
        message: "Subscription cancelled successfully",
      });
    } catch (error: any) {
      if (error.message === "SUBSCRIPTION_NOT_FOUND") {
        return res.status(404).json({
          error: { code: "SUBSCRIPTION_NOT_FOUND" },
        });
      }

      console.error("Cancel subscription error:", error);
      return res.status(500).json({
        error: {
          code: "SERVER_ERROR",
          message: "Failed to cancel subscription",
        },
      });
    }
  },
);

/**
 * GET /api/payments/checkout/:sessionId
 * Vérifier le statut d'une session de checkout Stripe
 */
router.get("/payments/checkout/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: { code: "SESSION_ID_REQUIRED", message: "Session ID required" },
      });
    }

    const svc = ensureStripeService();
    const sessionDetails = await svc.getCheckoutSession(sessionId);

    return res.json(sessionDetails);
  } catch (error: any) {
    console.error("Get checkout session error:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to retrieve checkout session",
      },
    });
  }
});

/**
 * GET /api/payments/status
 * Statut de paiement et limites du tenant
 */
router.get("/payments/status", tenantIsolationMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant!.tenantId;
    const tenant = await tenantService.getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        error: { code: "TENANT_NOT_FOUND" },
      });
    }

    const hasActiveSession = await tenantService.hasActiveSession(tenantId);
    const usage = await tenantService.getTenantUsage(tenantId);

    return res.json({
      subscription: {
        plan: tenant.subscription_plan,
        status: tenant.subscription_status,
        expiresAt: tenant.subscription_expires_at,
        isActive: tenant.isSubscriptionActive(),
      },
      limits: {
        maxEvents: tenant.max_concurrent_events,
        maxPlayersPerEvent: tenant.max_players_per_event,
        maxUsers: tenant.max_users,
      },
      usage,
      hasActiveSession,
      canCreateEvent: tenant.canCreateEvent() || hasActiveSession,
      hasStripeCustomer: !!tenant.stripe_customer_id, // Indique si un client Stripe existe
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR" },
    });
  }
});

export default router;
