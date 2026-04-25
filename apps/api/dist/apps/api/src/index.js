"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const indexes_1 = require("./config/indexes");
const env_1 = require("./config/env");
const auth_1 = __importDefault(require("./routes/auth"));
const rateLimit_1 = require("./middleware/rateLimit");
const shops_1 = __importDefault(require("./routes/shops"));
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const promos_1 = __importDefault(require("./routes/promos"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const leads_1 = __importDefault(require("./routes/leads"));
const admin_1 = __importDefault(require("./routes/admin"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const users_1 = __importDefault(require("./routes/users"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const app = (0, express_1.default)();
// Headers CORS manuels — avant cors()
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://shopeasy-1-kahg.onrender.com');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// ✅ 1. CORS en premier — avant tout le reste
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://shopeasy-1-kahg.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ✅ 2. Preflight OPTIONS global
app.options('*', (0, cors_1.default)());
// ✅ 3. Body parsers (une seule fois)
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ✅ 4. Rate limiter général
app.use(rateLimit_1.generalLimiter);
// ✅ 5. Routes auth (limiter spécifique AVANT les routes)
app.use('/api/auth/login', rateLimit_1.authLimiter);
app.use('/api/auth/register', rateLimit_1.authLimiter);
app.use('/api/auth', auth_1.default);
// ✅ 6. Autres routes
app.use('/api/shops', shops_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/promos', promos_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/uploads', uploads_1.default);
app.use('/api/users', users_1.default);
app.use('/api/reviews', reviews_1.default);
// Route de santé
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        env: env_1.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});
// Démarrage du serveur
const start = async () => {
    await (0, db_1.connectDB)();
    await (0, indexes_1.syncIndexes)();
    (0, redis_1.connectRedis)();
    app.listen(Number(env_1.env.PORT), () => {
        console.log(`🚀 API ShopEasy CI démarrée sur le port ${env_1.env.PORT}`);
        console.log(`📍 Health check : http://localhost:${env_1.env.PORT}/health`);
    });
};
start().catch((err) => {
    console.error('❌ Erreur démarrage API :', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map