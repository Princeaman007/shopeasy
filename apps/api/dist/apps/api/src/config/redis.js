"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = exports.connectRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
const connectRedis = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new ioredis_1.default(redisUrl, {
        retryStrategy: (times) => {
            if (times > 5)
                return null;
            return Math.min(times * 500, 2000);
        },
        lazyConnect: false,
    });
    redisClient.on('connect', () => console.log('✅ Redis connecté'));
    redisClient.on('error', (err) => console.error('❌ Erreur Redis :', err.message));
    redisClient.on('reconnecting', () => console.warn('🔄 Redis reconnexion...'));
    return redisClient;
};
exports.connectRedis = connectRedis;
const getRedis = () => {
    if (!redisClient) {
        throw new Error('❌ Redis non initialisé — appelle connectRedis() d\'abord');
    }
    return redisClient;
};
exports.getRedis = getRedis;
//# sourceMappingURL=redis.js.map