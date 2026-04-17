import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const connectRedis = (): Redis => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    retryStrategy: (times: number) => {
      if (times > 5) return null;
      return Math.min(times * 500, 2000);
    },
    lazyConnect: false,
  });

  redisClient.on('connect', () => console.log('✅ Redis connecté'));
  redisClient.on('error', (err: Error) => console.error('❌ Erreur Redis :', err.message));
  redisClient.on('reconnecting', () => console.warn('🔄 Redis reconnexion...'));

  return redisClient;
};

export const getRedis = (): Redis => {
  if (!redisClient) {
    throw new Error('❌ Redis non initialisé — appelle connectRedis() d\'abord');
  }
  return redisClient;
};