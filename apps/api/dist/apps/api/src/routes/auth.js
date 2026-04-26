"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const Shop_1 = require("../models/Shop");
const Category_1 = require("../models/Category");
const types_1 = require("@shopeasy/types");
const jwt_1 = require("../config/jwt");
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../config/redis");
const Email_1 = require("../services/Email");
const OrderAttachment_1 = require("../services/OrderAttachment");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/register — Inscription marchand
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        const parsed = types_1.RegisterMerchantSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { name, email, phone, password, shopName, shopSlug, whatsapp } = parsed.data;
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Cet email est deja utilise' });
            return;
        }
        const existingShop = await Shop_1.Shop.findOne({ slug: shopSlug });
        if (existingShop) {
            res.status(409).json({ success: false, message: 'Ce nom de boutique est deja pris' });
            return;
        }
        const user = await User_1.User.create({
            name, email, phone, password,
            role: 'merchant',
            emailVerified: false,
        });
        const shop = await Shop_1.Shop.create({
            slug: shopSlug,
            name: shopName,
            ownerId: user._id,
            whatsapp,
            planType: 'basic',
            selectedTheme: 'vitrine-moderne',
            subscriptionStatus: 'trial',
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            subscriptionExpiresAt: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
        });
        await User_1.User.findByIdAndUpdate(user._id, { shopId: shop._id });
        await Category_1.Category.insertMany(Category_1.PREDEFINED_CATEGORIES.map((cat) => ({
            shopId: shop._id, name: cat.name, slug: cat.slug,
            icon: cat.icon, order: cat.order, predefined: true, parentId: null,
        })));
        // Genere token confirmation email et stocke dans Redis 24h
        const confirmToken = crypto_1.default.randomBytes(32).toString('hex');
        const redis = (0, redis_1.getRedis)();
        await redis.setex(`confirm:${confirmToken}`, 24 * 60 * 60, String(user._id));
        // Envoie email de confirmation
        try {
            await (0, Email_1.sendEmailConfirmation)(email, name, confirmToken);
        }
        catch (emailErr) {
            console.error('Erreur envoi email confirmation:', emailErr);
        }
        res.status(201).json({
            success: true,
            message: 'Compte cree — verifiez votre email pour confirmer votre inscription',
            data: { email },
        });
    }
    catch (error) {
        console.error('Erreur inscription :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET ${process.env.NEXT_PUBLIC_API_URL}/auth/confirm-email?token=xxx
// ---------------------------------------------------------------------------
router.get('/confirm-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            res.status(400).json({ success: false, message: 'Token manquant' });
            return;
        }
        const redis = (0, redis_1.getRedis)();
        const userId = await redis.get(`confirm:${String(token)}`);
        if (!userId) {
            res.status(400).json({ success: false, message: 'Lien invalide ou expire' });
            return;
        }
        const user = await User_1.User.findByIdAndUpdate(userId, { emailVerified: true }, { new: true });
        if (!user) {
            res.status(400).json({ success: false, message: 'Utilisateur introuvable' });
            return;
        }
        await redis.del(`confirm:${String(token)}`);
        // Envoie email de bienvenue
        try {
            const shop = user.shopId ? await Shop_1.Shop.findById(user.shopId) : null;
            await (0, Email_1.sendWelcomeEmail)(user.email, user.name, shop?.slug ?? '');
        }
        catch (emailErr) {
            console.error('Erreur envoi email bienvenue:', emailErr);
        }
        res.json({
            success: true,
            message: 'Email confirme — vous pouvez maintenant vous connecter',
        });
    }
    catch (error) {
        console.error('Erreur confirm-email :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/resend-confirmation — Renvoyer l'email de confirmation
// ---------------------------------------------------------------------------
router.post('/resend-confirmation', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email obligatoire' });
            return;
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase() }).select('+emailVerified');
        if (!user) {
            res.json({ success: true, message: 'Si cet email existe, un nouveau lien a ete envoye' });
            return;
        }
        if (user.emailVerified) {
            res.status(400).json({ success: false, message: 'Email deja confirme' });
            return;
        }
        const confirmToken = crypto_1.default.randomBytes(32).toString('hex');
        const redis = (0, redis_1.getRedis)();
        await redis.setex(`confirm:${confirmToken}`, 24 * 60 * 60, String(user._id));
        try {
            await (0, Email_1.sendEmailConfirmation)(user.email, user.name, confirmToken);
        }
        catch (emailErr) {
            console.error('Erreur renvoi email:', emailErr);
        }
        res.json({ success: true, message: 'Nouveau lien de confirmation envoye' });
    }
    catch (error) {
        console.error('Erreur resend-confirmation :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const parsed = types_1.LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { email, password } = parsed.data;
        const user = await User_1.User.findOne({ email }).select('+password +emailVerified');
        if (!user) {
            res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
            return;
        }
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
            return;
        }
        // Verifie que l'email est confirme
        if (!user.emailVerified) {
            res.status(403).json({
                success: false,
                message: 'Veuillez confirmer votre email avant de vous connecter',
                code: 'EMAIL_NOT_VERIFIED',
            });
            return;
        }
        let shop = null;
        if (user.role === 'merchant' && user.shopId) {
            shop = await Shop_1.Shop.findById(user.shopId).select('slug name planType subscriptionStatus trialEndsAt selectedTheme');
        }
        const tokenPayload = {
            userId: String(user._id),
            role: user.role,
            shopId: user.shopId ? String(user.shopId) : undefined,
        };
        const token = (0, jwt_1.signToken)(tokenPayload);
        const refreshToken = (0, jwt_1.signRefreshToken)(tokenPayload);
        res.cookie('token', token, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        if (user.role === 'client') {
            await (0, OrderAttachment_1.rattacherCommandesInvite)(String(user._id), user.email);
        }
        res.json({
            success: true,
            message: 'Connexion reussie',
            data: {
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                shop,
                token,
            },
        });
    }
    catch (error) {
        console.error('Erreur connexion :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/refresh
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ success: false, message: 'Refresh token manquant' });
            return;
        }
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await User_1.User.findById(payload.userId);
        if (!user) {
            res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
            return;
        }
        const newToken = (0, jwt_1.signToken)({
            userId: String(user._id),
            role: user.role,
            shopId: user.shopId ? String(user.shopId) : undefined,
        });
        res.cookie('token', newToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ success: true, token: newToken });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/logout
// ---------------------------------------------------------------------------
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Deconnecte avec succes' });
});
// ---------------------------------------------------------------------------
// GET ${process.env.NEXT_PUBLIC_API_URL}/auth/me
// ---------------------------------------------------------------------------
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'Non authentifie' });
            return;
        }
        const payload = (0, jwt_1.verifyToken)(token);
        const user = await User_1.User.findById(payload.userId).select('-password');
        if (!user) {
            res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
            return;
        }
        let shop = null;
        if (user.role === 'merchant' && user.shopId) {
            shop = await Shop_1.Shop.findById(user.shopId).select('slug name planType subscriptionStatus trialEndsAt selectedTheme isVerified');
        }
        res.json({ success: true, data: { user, shop } });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/register-client
// ---------------------------------------------------------------------------
router.post('/register-client', async (req, res) => {
    try {
        const parsed = types_1.RegisterClientSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { name, email, phone, password } = parsed.data;
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Cet email est deja utilise' });
            return;
        }
        // Client avec confirmation email
        const user = await User_1.User.create({
            name, email, phone, password,
            role: 'client',
            emailVerified: false,
        });
        // Genere token confirmation
        const confirmToken = crypto_1.default.randomBytes(32).toString('hex');
        const redis = (0, redis_1.getRedis)();
        await redis.setex(`confirm:${confirmToken}`, 24 * 60 * 60, String(user._id));
        try {
            await (0, Email_1.sendEmailConfirmation)(email, name, confirmToken);
        }
        catch (emailErr) {
            console.error('Erreur envoi email confirmation client:', emailErr);
        }
        res.status(201).json({
            success: true,
            message: 'Compte cree — verifiez votre email pour confirmer votre inscription',
            data: { email },
        });
    }
    catch (error) {
        console.error('Erreur inscription client :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email obligatoire' });
            return;
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de reinitialisation' });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const redis = (0, redis_1.getRedis)();
        await redis.setex(`reset:${resetToken}`, 60 * 60, String(user._id));
        await (0, Email_1.sendPasswordResetEmail)(user.email, user.name, resetToken);
        res.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de reinitialisation' });
    }
    catch (error) {
        console.error('Erreur forgot-password :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ success: false, message: 'Token et mot de passe obligatoires' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ success: false, message: 'Mot de passe trop court — minimum 6 caracteres' });
            return;
        }
        const redis = (0, redis_1.getRedis)();
        const userId = await redis.get(`reset:${token}`);
        if (!userId) {
            res.status(400).json({ success: false, message: 'Token invalide ou expire' });
            return;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(400).json({ success: false, message: 'Utilisateur introuvable' });
            return;
        }
        user.password = password;
        await user.save();
        await redis.del(`reset:${token}`);
        res.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
    }
    catch (error) {
        console.error('Erreur reset-password :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map