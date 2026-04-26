"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Analytics_1 = require("../models/Analytics");
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const Shop_1 = require("../models/Shop");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── Middleware Premium ───────────────────────────────────────────────────────
const requirePremium = (req, res, next) => {
    if (req.shop.planType !== 'premium') {
        res.status(403).json({
            success: false,
            message: 'Les analytics avances sont reserves au plan Premium',
            code: 'PREMIUM_REQUIRED',
        });
        return;
    }
    next();
};
// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (date) => date.toISOString().split('T')[0];
const derniers30Jours = () => {
    const jours = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        jours.push(formatDate(d));
    }
    return jours;
};
// ─── GET /analytics/basic — Stats basiques (tous plans) ──────────────────────
router.get('/basic', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shopId = new mongoose_1.default.Types.ObjectId(req.shop.id);
        const debut = new Date();
        debut.setDate(debut.getDate() - 30);
        const [commandesTotal, commandesMois, commandesLivrees, produitsActifs,] = await Promise.all([
            Order_1.Order.countDocuments({ shopId }),
            Order_1.Order.countDocuments({ shopId, createdAt: { $gte: debut } }),
            Order_1.Order.countDocuments({ shopId, status: 'delivered' }),
            Product_1.Product.countDocuments({ shopId, status: 'active' }),
        ]);
        const caTotal = await Order_1.Order.aggregate([
            { $match: { shopId, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        const caMois = await Order_1.Order.aggregate([
            { $match: { shopId, status: 'delivered', createdAt: { $gte: debut } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        const parStatut = await Order_1.Order.aggregate([
            { $match: { shopId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const statutMap = parStatut.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const evolutionCommandes = await Order_1.Order.aggregate([
            { $match: { shopId, createdAt: { $gte: debut } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    commandes: { $sum: 1 },
                    revenue: { $sum: '$total' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const joursMap = evolutionCommandes.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});
        const evolution = derniers30Jours().map((jour) => ({
            date: jour,
            commandes: joursMap[jour]?.commandes ?? 0,
            revenue: joursMap[jour]?.revenue ?? 0,
        }));
        res.json({
            success: true,
            data: {
                resume: {
                    commandesTotal,
                    commandesMois,
                    commandesLivrees,
                    produitsActifs,
                    chiffreAffairesTotal: caTotal[0]?.total ?? 0,
                    chiffreAffairesMois: caMois[0]?.total ?? 0,
                },
                parStatut: statutMap,
                evolution,
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /analytics/basic :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── GET /analytics/advanced — Analytics avances (Premium) ───────────────────
router.get('/advanced', auth_1.authenticate, auth_1.requireMerchant, requirePremium, async (req, res) => {
    try {
        const shopId = new mongoose_1.default.Types.ObjectId(req.shop.id);
        const periode = req.query.periode === '7' ? 7 : 30;
        const debut = new Date();
        debut.setDate(debut.getDate() - periode);
        const depuisStr = debut.toISOString().split('T')[0];
        // ── Evolution depuis les vraies commandes ──
        const evolutionCommandes = await Order_1.Order.aggregate([
            { $match: { shopId, createdAt: { $gte: debut } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    commandes: { $sum: 1 },
                    revenue: { $sum: '$total' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const joursMap = evolutionCommandes.reduce((acc, item) => { acc[item._id] = item; return acc; }, {});
        const joursListe = [];
        for (let i = periode - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            joursListe.push(d.toISOString().split('T')[0]);
        }
        // ── Visites depuis Analytics (peut etre vide) ──
        const analyticsData = await Analytics_1.Analytics.find({
            shopId,
            date: { $gte: depuisStr },
        }).lean();
        const analyticsMap = analyticsData.reduce((acc, item) => { acc[item.date] = item; return acc; }, {});
        const evolution = joursListe.map((jour) => ({
            date: jour,
            visiteurs: analyticsMap[jour]?.visitors ?? 0,
            commandes: joursMap[jour]?.commandes ?? 0,
            revenue: joursMap[jour]?.revenue ?? 0,
            conversion: 0,
        }));
        // ── Top produits ──
        const topProduits = await Order_1.Order.aggregate([
            {
                $match: {
                    shopId,
                    createdAt: { $gte: debut },
                    status: { $ne: 'cancelled' },
                },
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    commandes: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { commandes: -1 } },
            { $limit: 5 },
        ]);
        const totalVisiteurs = analyticsData.reduce((s, a) => s + a.visitors, 0);
        const totalCommandes = evolutionCommandes.reduce((s, a) => s + a.commandes, 0);
        const totalRevenue = evolutionCommandes.reduce((s, a) => s + a.revenue, 0);
        res.json({
            success: true,
            data: {
                periode,
                totalVisiteurs,
                totalCommandes,
                totalRevenue,
                tauxConversion: '0%',
                evolution,
                topProduits,
                topVilles: [],
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /analytics/advanced :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── POST /analytics/track ────────────────────────────────────────────────────
router.post('/track', async (req, res) => {
    try {
        const { shopId, source = 'direct' } = req.body;
        if (!shopId) {
            res.status(400).json({ success: false, message: 'shopId obligatoire' });
            return;
        }
        const aujourd_hui = formatDate(new Date());
        const sources = ['instagram', 'tiktok', 'facebook', 'direct', 'other'];
        const sourceValide = sources.includes(source) ? source : 'other';
        await Analytics_1.Analytics.findOneAndUpdate({ shopId, date: aujourd_hui }, {
            $inc: {
                visitors: 1,
                [`sources.${sourceValide}`]: 1,
            },
        }, { upsert: true, new: true });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Erreur POST /analytics/track :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── GET /analytics/me ────────────────────────────────────────────────────────
router.get('/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ ownerId: req.user.userId });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const periode = req.query.periode === '30j' ? 30 : 7;
        const depuis = new Date();
        depuis.setDate(depuis.getDate() - periode);
        const depuisStr = depuis.toISOString().split('T')[0];
        const data = await Analytics_1.Analytics.find({
            shopId: shop._id,
            date: { $gte: depuisStr },
        })
            .sort({ date: 1 })
            .lean();
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map