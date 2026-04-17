import rateLimit from 'express-rate-limit';
import { getRedis } from '../config/redis';

/**
 * Rate limiter general
 * 100 requetes par 15 minutes par IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Trop de requetes — reessayez dans 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter strict pour l'auth
 * 10 tentatives par heure par IP
 * Protege contre le brute force
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion — reessayez dans 1 heure',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Uniquement sur les echecs (status >= 400)
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter pour l'upload
 * 20 uploads par heure par IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: {
    success: false,
    message: 'Trop d uploads — reessayez dans 1 heure',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les commandes
 * 30 commandes par heure par IP
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  message: {
    success: false,
    message: 'Trop de commandes — reessayez dans 1 heure',
    code: 'ORDER_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour l'agent Koffi
 * 20 messages par heure par IP
 */
export const koffiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: {
    success: false,
    message: 'Trop de messages a Koffi — reessayez dans 1 heure',
    code: 'KOFFI_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});