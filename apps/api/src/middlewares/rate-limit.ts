import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private windowMs: number = 60000, private maxRequests: number = 100) {
    // Nettoyage périodique des entrées expirées
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, this.windowMs);
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre ou première requête
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Rate limiters pour différents cas d'usage
// En production, limites très élevées pour supporter des centaines de joueurs simultanés
// Toutes les requêtes passent par le même proxy (Traefik), donc partagent la même IP
const isDevelopment = process.env.NODE_ENV === 'development';
const generalLimiter = new RateLimiter(60000, isDevelopment ? 1000 : 10000); // 10000 req/min en production pour beaucoup de joueurs
const answerLimiter = new RateLimiter(1000, isDevelopment ? 200 : 200); // 200 réponses/sec par équipe
const authLimiter = new RateLimiter(60000, isDevelopment ? 1000 : 100); // 100 tentatives auth/min (au lieu de 20/5min)

export function createRateLimit(limiter: RateLimiter, keyFn: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);
    const result = limiter.check(key);

    res.set({
      'X-RateLimit-Limit': String(limiter['maxRequests']),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000))
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }
      });
    }

    next();
  };
}

// Middlewares prêts à l'emploi
export const generalRateLimit = createRateLimit(
  generalLimiter,
  (req) => req.ip || "anonymous"
);

export const answerRateLimit = createRateLimit(
  answerLimiter,
  (req) => {
    // Limiter par équipe pour les soumissions de réponses
    const teamId = req.body?.teamId || (req as any).player?.teamId || "anonymous";
    return `answer:${teamId}`;
  }
);

export const authRateLimit = createRateLimit(
  authLimiter,
  (req) => `auth:${req.ip || "anonymous"}`
);

// Cleanup au shutdown
process.on('SIGINT', () => {
  generalLimiter.destroy();
  answerLimiter.destroy();
  authLimiter.destroy();
});

process.on('SIGTERM', () => {
  generalLimiter.destroy();
  answerLimiter.destroy();
  authLimiter.destroy();
});