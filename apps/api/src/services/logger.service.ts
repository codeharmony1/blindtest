import winston from "winston";
import { env } from "../config/env";

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Logger principal
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: {
    service: 'blind-test-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// En production, ajouter des transports fichiers
if (env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 10,
  }));
}

// Logger spécialisé pour les événements de sécurité
export const securityLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  defaultMeta: {
    service: 'blind-test-security',
    category: 'security'
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/security.log',
      maxsize: 5242880,
      maxFiles: 5,
    })
  ]
});

// Logger pour les performances
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  defaultMeta: {
    service: 'blind-test-performance',
    category: 'performance'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/performance.log',
      maxsize: 5242880,
      maxFiles: 3,
    })
  ]
});

// Middleware de logging des requêtes
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(data: any) {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get('Content-Length') || 0
    };

    // Log des erreurs
    if (res.statusCode >= 400) {
      logger.warn('HTTP Error', logData);
    } else if (duration > 1000) {
      // Log des requêtes lentes
      performanceLogger.warn('Slow Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    return originalSend.call(this, data);
  };

  next();
}

// Fonction pour logger les événements de sécurité
export function logSecurityEvent(event: string, details: any, req?: any) {
  securityLogger.warn('Security Event', {
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
}

// Fonction pour logger les erreurs d'authentification
export function logAuthFailure(reason: string, details: any, req?: any) {
  securityLogger.error('Authentication Failure', {
    reason,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
}

// Fonction pour logger les performances
export function logPerformance(operation: string, duration: number, details?: any) {
  performanceLogger.info('Performance Metric', {
    operation,
    duration,
    details,
    timestamp: new Date().toISOString()
  });
}