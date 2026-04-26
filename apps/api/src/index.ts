import express from 'express';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { syncIndexes } from './config/indexes';
import { env } from './config/env';
import authRoutes from './routes/auth';
import { generalLimiter, authLimiter } from './middleware/rateLimit';
import shopRoutes from './routes/shops';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import promoRoutes from './routes/promos';
import analyticsRoutes from './routes/analytics';
import leadRoutes from './routes/leads';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/uploads';
import usersRouter from './routes/users';
import reviewsRouter from './routes/reviews';

const app = express();

// CORS temporaire — autorise tout
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter général
app.use(generalLimiter);

// Routes auth
app.use('/backend/auth/login', authLimiter);
app.use('/backend/auth/register', authLimiter);
app.use('/backend/auth', authRoutes);

// Autres routes
app.use('/backend/shops', shopRoutes);
app.use('/backend/categories', categoryRoutes);
app.use('/backend/products', productRoutes);
app.use('/backend/orders', orderRoutes);
app.use('/backend/promos', promoRoutes);
app.use('/backend/analytics', analyticsRoutes);
app.use('/backend/leads', leadRoutes);
app.use('/backend/admin', adminRoutes);
app.use('/backend/uploads', uploadRoutes);
app.use('/backend/users', usersRouter);
app.use('/backend/reviews', reviewsRouter);

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
  await connectDB();
  await syncIndexes();
  connectRedis();

  app.listen(Number(env.PORT), () => {
    console.log(`🚀 API ShopEasy CI démarrée sur le port ${env.PORT}`);
    console.log(`📍 Health check : http://localhost:${env.PORT}/health`);
  });
};

start().catch((err) => {
  console.error('❌ Erreur démarrage API :', err);
  process.exit(1);
});