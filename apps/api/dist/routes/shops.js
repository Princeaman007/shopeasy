"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const Shop_1 = require("../models/Shop");
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const auth_1 = require("../middleware/auth");
const ShopService_1 = require("../services/ShopService");
// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
});
const uploadHero = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});
// ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const router = (0, express_1.Router)();
// ─── Schemas Zod ──────────────────────────────────────────────────────────────
const updateShopSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(60).optional(),
    whatsapp: zod_1.z.string().min(8).max(20).optional(),
    whatsappOrderNotif: zod_1.z.boolean().optional(),
    logo: zod_1.z.string().optional(),
});
const updateAboutSchema = zod_1.z.object({
    description: zod_1.z.string().max(1000).optional(),
    ownerName: zod_1.z.string().max(100).optional(),
    ownerPhoto: zod_1.z.string().optional(),
    location: zod_1.z.string().max(200).optional(),
    workingHours: zod_1.z.string().max(200).optional(),
    returnPolicy: zod_1.z.string().max(500).optional(),
});
// ─── Helper Cloudinary ────────────────────────────────────────────────────────
const uploadToCloudinary = (buffer, folder, transformation) => new Promise((resolve, reject) => {
    const stream = cloudinary_1.v2.uploader.upload_stream({ folder, transformation }, (error, result) => { if (error)
        reject(error);
    else
        resolve(result); });
    stream.end(buffer);
});
// ─── Helper — trouve la boutique du marchand ou de l'équipier ─────────────────
const getMyShop = async (userId, shopId) => {
    // Propriétaire
    let shop = await Shop_1.Shop.findOne({ ownerId: userId });
    // Équipier — utilise le shopId du token JWT
    if (!shop && shopId) {
        shop = await Shop_1.Shop.findById(shopId);
    }
    return shop;
};
// ─── GET /shops/me ────────────────────────────────────────────────────────────
router.get('/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        res.json({ success: true, data: shop });
    }
    catch (error) {
        console.error('Erreur GET /shops/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── GET /shops/me/stats ──────────────────────────────────────────────────────
router.get('/me/stats', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const [totalProduits, totalCategories] = await Promise.all([
            Product_1.Product.countDocuments({ shopId: shop._id, status: 'active' }),
            Category_1.Category.countDocuments({ shopId: shop._id }),
        ]);
        res.json({
            success: true,
            data: {
                totalProduits,
                totalCategories,
                planType: shop.planType,
                subscriptionStatus: shop.subscriptionStatus,
                subscriptionExpiresAt: shop.subscriptionExpiresAt,
                isVerified: shop.isVerified,
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /shops/me/stats :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── GET /shops/me/equipe ─────────────────────────────────────────────────────
router.get('/me/equipe', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        await shop.populate('admins', 'name email');
        res.json({ success: true, membres: shop.admins });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ─── POST /shops/me/equipe ────────────────────────────────────────────────────
router.post('/me/equipe', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email obligatoire' });
            return;
        }
        const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
        const userToAdd = await User.findOne({ email: email.toLowerCase() });
        if (!userToAdd) {
            res.status(404).json({ success: false, message: 'Aucun compte trouve avec cet email' });
            return;
        }
        const shop = await Shop_1.Shop.findOne({ ownerId: req.user.userId });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        if (shop.planType !== 'premium') {
            res.status(403).json({ success: false, message: 'Fonctionnalite Premium uniquement' });
            return;
        }
        if (String(userToAdd._id) === req.user.userId) {
            res.status(400).json({ success: false, message: 'Vous etes deja proprietaire' });
            return;
        }
        const dejaAdmin = shop.admins.some((a) => String(a) === String(userToAdd._id));
        if (dejaAdmin) {
            res.status(400).json({ success: false, message: "Cet utilisateur est deja dans l'equipe" });
            return;
        }
        shop.admins.push(userToAdd._id);
        await shop.save();
        // ✅ Change le rôle de l'équipier en merchant et assigne le shopId
        await User.findByIdAndUpdate(userToAdd._id, {
            role: 'merchant',
            shopId: shop._id,
        });
        await shop.populate('admins', 'name email');
        res.json({ success: true, membres: shop.admins });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ─── DELETE /shops/me/equipe/:userId ─────────────────────────────────────────
router.delete('/me/equipe/:userId', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ ownerId: req.user.userId });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        shop.admins = shop.admins.filter((a) => String(a) !== req.params.userId);
        await shop.save();
        await shop.populate('admins', 'name email');
        res.json({ success: true, membres: shop.admins });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ─── PATCH /shops/me ─────────────────────────────────────────────────────────
router.patch('/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = updateShopSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, message: 'Donnees invalides', errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { name, whatsapp, whatsappOrderNotif, logo } = parsed.data;
        if (name && name !== shop.name) {
            shop.name = name;
            shop.slug = await ShopService_1.ShopService.generateUniqueSlug(name);
        }
        if (whatsapp !== undefined)
            shop.whatsapp = whatsapp;
        if (whatsappOrderNotif !== undefined)
            shop.whatsappOrderNotif = whatsappOrderNotif;
        if (logo !== undefined)
            shop.logo = logo;
        await shop.save();
        res.json({ success: true, data: shop, message: 'Boutique mise a jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /shops/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── PATCH /shops/me/theme ────────────────────────────────────────────────────
router.patch('/me/theme', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const { selectedTheme } = req.body;
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const THEMES_BASIC = ['vitrine-moderne', 'marche-colore'];
        const THEMES_PREMIUM = [...THEMES_BASIC, 'luxe-sombre', 'boutique-pro', 'stories-style'];
        const themes = shop.planType === 'premium' ? THEMES_PREMIUM : THEMES_BASIC;
        if (!themes.includes(selectedTheme)) {
            res.status(403).json({ success: false, message: 'Theme non disponible pour votre plan' });
            return;
        }
        shop.selectedTheme = selectedTheme;
        await shop.save();
        res.json({ success: true, data: shop, message: 'Theme mis a jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /shops/me/theme :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── PATCH /shops/me/about ────────────────────────────────────────────────────
router.patch('/me/about', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = updateAboutSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, message: 'Donnees invalides', errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        shop.about = parsed.data;
        await shop.save();
        res.json({ success: true, data: shop, message: 'A propos mis a jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /shops/me/about :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── POST /shops/me/logo ──────────────────────────────────────────────────────
router.post('/me/logo', auth_1.authenticate, auth_1.requireMerchant, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Aucun fichier recu' });
            return;
        }
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const result = await uploadToCloudinary(req.file.buffer, `shopeasy/${shop._id}/logo`, [{ width: 400, height: 400, crop: 'fill' }]);
        res.json({ success: true, url: result.secure_url });
    }
    catch (error) {
        console.error('Erreur upload logo :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── POST /shops/me/owner-photo ───────────────────────────────────────────────
router.post('/me/owner-photo', auth_1.authenticate, auth_1.requireMerchant, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Aucun fichier recu' });
            return;
        }
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const result = await uploadToCloudinary(req.file.buffer, `shopeasy/${shop._id}/owner`, [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]);
        res.json({ success: true, url: result.secure_url });
    }
    catch (error) {
        console.error('Erreur upload owner-photo :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── POST /shops/me/hero ──────────────────────────────────────────────────────
router.post('/me/hero', auth_1.authenticate, auth_1.requireMerchant, (req, res, next) => {
    uploadHero.single('file')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            return res.status(400).json({ success: false, message: 'Fichier trop volumineux — max 10 Mo' });
        }
        if (err)
            return res.status(500).json({ success: false, message: 'Erreur upload' });
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Aucun fichier recu' });
            return;
        }
        const shop = await getMyShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const result = await uploadToCloudinary(req.file.buffer, `shopeasy/${shop._id}/hero`, [{ width: 1920, height: 600, crop: 'fill', gravity: 'auto' }]);
        shop.heroImage = result.secure_url;
        await shop.save();
        res.json({ success: true, url: result.secure_url });
    }
    catch (error) {
        console.error('Erreur upload hero :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── GET /shops/annuaire ──────────────────────────────────────────────────────
router.get('/annuaire', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limite = 12;
        const recherche = req.query.q || '';
        const skip = (page - 1) * limite;
        const filtre = {
            planType: 'premium',
            subscriptionStatus: { $in: ['active', 'trial'] },
        };
        if (recherche.trim()) {
            filtre.name = { $regex: recherche.trim(), $options: 'i' };
        }
        const [boutiques, total] = await Promise.all([
            Shop_1.Shop.find(filtre)
                .select('slug name about isVerified selectedTheme createdAt heroImage logo')
                .sort({ isVerified: -1, createdAt: -1 })
                .skip(skip)
                .limit(limite)
                .lean(),
            Shop_1.Shop.countDocuments(filtre),
        ]);
        const boutiquesAvecProduits = await Promise.all(boutiques.map(async (shop) => {
            const produits = await Product_1.Product.find({ shopId: shop._id, status: 'active' })
                .select('name price images')
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();
            return { ...shop, produits };
        }));
        res.json({
            boutiques: boutiquesAvecProduits,
            pagination: {
                page,
                total,
                pages: Math.ceil(total / limite),
                parPage: limite,
            },
        });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ─── GET /shops/:slug — DOIT etre en dernier ──────────────────────────────────
router.get('/:slug', async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ slug: req.params.slug }).select('-__v').lean();
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        if (shop.subscriptionStatus === 'expired' || shop.subscriptionStatus === 'suspended') {
            res.status(403).json({ success: false, message: 'Cette boutique est temporairement indisponible' });
            return;
        }
        res.json({ success: true, data: shop });
    }
    catch (error) {
        console.error('Erreur GET /shops/:slug :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=shops.js.map