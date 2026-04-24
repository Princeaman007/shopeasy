/**
 * Rate limiter general
 * 100 requetes par 15 minutes par IP
 */
export declare const generalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter strict pour l'auth
 * 10 tentatives par heure par IP
 * Protege contre le brute force
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter pour l'upload
 * 20 uploads par heure par IP
 */
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter pour les commandes
 * 30 commandes par heure par IP
 */
export declare const orderLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter pour l'agent Koffi
 * 20 messages par heure par IP
 */
export declare const koffiLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.d.ts.map