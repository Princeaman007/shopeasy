import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { syncIndexes } from './config/indexes';
import { env } from './config/env';
import authRoutes from './routes/auth';
import { generalLimiter, authLimiter } from './middleware/rateLimit';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares globaux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
// Route de santé
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Démarrage du serveur
const start = async (): Promise<void> => {
  // 1. Connexion MongoDB
  await connectDB();

  // 2. Synchronisation des index
  await syncIndexes();

  // 3. Connexion Redis
  connectRedis();

  // 4. Démarrage serveur
  app.listen(Number(env.PORT), () => {
    console.log(`🚀 API ShopEasy CI démarrée sur le port ${env.PORT}`);
    console.log(`📍 Health check : http://localhost:${env.PORT}/health`);
  });
};

start().catch((err) => {
  console.error('❌ Erreur démarrage API :', err);
  process.exit(1);
});