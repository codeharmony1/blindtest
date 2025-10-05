import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "./config/env";
import { generalRateLimit, authRateLimit } from "./middlewares/rate-limit";
import { requestLogger } from "./services/logger.service";
import { sanitizeInput, validatePayloadSize } from "./middlewares/validation";

import eventRoutes from "./modules/events/routes";
import teamRoutes from "./modules/teams/routes";
import playerRoutes from "./modules/players/routes";
import roundRoutes from "./modules/rounds/routes";
import songRoutes from "./modules/songs/routes";
import answerRoutes from "./modules/answers/routes";
import scoreRoutes from "./modules/scores/routes";
import authRoutes from "./modules/auth/routes";
import csvRoutes from "./modules/csv/routes";
import settingsRoutes from "./modules/settings/routes";
// Nouvelles routes multi-tenant
import tenantRoutes from "./modules/tenants/routes";
import paymentRoutes from "./modules/payments/routes";
// Super-admin routes
import superAdminRoutes from "./modules/super-admin/routes";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-client-type",
    ],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400, // 24 hours preflight cache
  }),
);

// Compression
app.use(compression());

// Body parsing with size limits
// Raw body parser for Stripe webhooks (doit être avant express.json)
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Trust proxy if behind reverse proxy
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Request logging
app.use(requestLogger);

// Debug: log toutes les requêtes
app.use((req, res, next) => {
  console.log("📥 Incoming request:", req.method, req.path, "Auth:", req.headers.authorization ? "PRESENT" : "ABSENT");
  next();
});

// Input sanitization
app.use(sanitizeInput);

// Payload size validation
app.use(validatePayloadSize(2 * 1024 * 1024)); // 2MB

// General rate limiting (disabled in development to ease local testing)
if (env.NODE_ENV !== "development") {
  app.use(generalRateLimit);
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: env.NODE_ENV,
  });
});

// Auth routes with specific rate limiting
app.use("/api", authRateLimit, authRoutes);

// Super-admin routes (URL non-évidente)
app.use("/api/backstage", superAdminRoutes);

// Routes multi-tenant (publiques et protégées)
app.use("/api", tenantRoutes);
app.use("/api", paymentRoutes);

// API routes legacy (avec isolation tenant automatique si nécessaire)
app.use("/api", eventRoutes);
app.use("/api", teamRoutes);
app.use("/api", playerRoutes);
app.use("/api", roundRoutes);
app.use("/api", songRoutes);
app.use("/api", answerRoutes);
app.use("/api", scoreRoutes);
app.use("/api", csvRoutes);
app.use("/api", settingsRoutes);

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Global error handler:", err);

    // Don't leak error details in production
    const isDev = env.NODE_ENV === "development";

    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: isDev ? err.message : "Validation failed",
        },
      });
    }

    if (err.name === "UnauthorizedError" || err.status === 401) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (err.status === 403) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
    }

    // Generic server error
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: isDev ? err.message : "Internal server error",
        ...(isDev && { stack: err.stack }),
      },
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

export default app;
