import express from 'express';
import cors from 'cors';
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
// Headers CORS manuels — avant cors()
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://shopeasy-web.vercel.app',);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ✅ 1. CORS en premier — avant tout le reste
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://shopeasy-web.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ 2. Preflight OPTIONS global
app.options('*', cors());

// ✅ 3. Body parsers (une seule fois)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 4. Rate limiter général
app.use(generalLimiter);

// ✅ 5. Routes auth (limiter spécifique AVANT les routes)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

// ✅ 6. Autres routes
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/users', usersRouter);
app.use('/api/reviews', reviewsRouter);

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
    console.log(` API ShopEasy CI démarrée sur le port ${env.PORT}`);
    console.log(` Health check : http://localhost:${env.PORT}/health`);
  });
};

start().catch((err) => {
  console.error('❌ Erreur démarrage API :', err);
  process.exit(1);
});