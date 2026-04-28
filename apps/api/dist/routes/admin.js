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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Shop_1 = require("../models/Shop");
const User_1 = require("../models/User");
const Order_1 = require("../models/Order");
const Lead_1 = require("../models/Lead");
const Product_1 = require("../models/Product");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// GET /admin/stats — Dashboard global
// ---------------------------------------------------------------------------
router.get('/stats', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const [totalBoutiques, boutiquesActives, boutiquesTrial, boutiquesExpirées, totalMarchands, totalClients, totalCommandes, nouvellesCommandes, totalLeads, leadsNouveaux, totalProduits, produitsActifs,] = await Promise.all([
            Shop_1.Shop.countDocuments(),
            Shop_1.Shop.countDocuments({ subscriptionStatus: 'active' }),
            Shop_1.Shop.countDocuments({ subscriptionStatus: 'trial' }),
            Shop_1.Shop.countDocuments({ subscriptionStatus: 'expired' }),
            User_1.User.countDocuments({ role: 'merchant' }),
            User_1.User.countDocuments({ role: 'client' }),
            Order_1.Order.countDocuments(),
            Order_1.Order.countDocuments({ status: 'new' }),
            Lead_1.Lead.countDocuments(),
            Lead_1.Lead.countDocuments({ status: 'new' }),
            Product_1.Product.countDocuments(),
            Product_1.Product.countDocuments({ status: 'active' }),
        ]);
        const boutiquesBasic = await Shop_1.Shop.countDocuments({ planType: 'basic', subscriptionStatus: 'active' });
        const boutiquesPremium = await Shop_1.Shop.countDocuments({ planType: 'premium', subscriptionStatus: 'active' });
        const mrr = (boutiquesBasic * 15000) + (boutiquesPremium * 30000);
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);
        const nouvellesBoutiquesMois = await Shop_1.Shop.countDocuments({
            createdAt: { $gte: debutMois },
        });
        // CA total commandes livrées
        const ca = await Order_1.Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        // Commandes aujourd'hui
        const debutJour = new Date();
        debutJour.setHours(0, 0, 0, 0);
        const commandesAujourdhui = await Order_1.Order.countDocuments({
            createdAt: { $gte: debutJour },
        });
        res.json({
            success: true,
            data: {
                marchands: {
                    total: totalMarchands,
                    basic: boutiquesBasic,
                    premium: boutiquesPremium,
                    trial: boutiquesTrial,
                    actifs: boutiquesActives,
                    expires: boutiquesExpirées,
                    nouvellesCeMois: nouvellesBoutiquesMois,
                },
                commandes: {
                    total: totalCommandes,
                    nouvelles: nouvellesCommandes,
                    aujourd_hui: commandesAujourdhui,
                    chiffreAffaires: ca[0]?.total ?? 0,
                },
                produits: {
                    total: totalProduits,
                    actifs: produitsActifs,
                },
                abonnements: {
                    revenus_mois: mrr,
                    basic_count: boutiquesBasic,
                    premium_count: boutiquesPremium,
                    expires_count: boutiquesExpirées,
                },
                utilisateurs: {
                    marchands: totalMarchands,
                    clients: totalClients,
                },
                leads: {
                    total: totalLeads,
                    nouveaux: leadsNouveaux,
                },
                mrr,
                boutiques: {
                    total: totalBoutiques,
                    actives: boutiquesActives,
                    trial: boutiquesTrial,
                    expirées: boutiquesExpirées,
                    basic: boutiquesBasic,
                    premium: boutiquesPremium,
                    nouvellesCeMois: nouvellesBoutiquesMois,
                },
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /admin/stats :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /admin/activites — Activité récente 24h
// ---------------------------------------------------------------------------
router.get('/activites', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [dernieresCommandes, dernieresBoutiques] = await Promise.all([
            Order_1.Order.find({ createdAt: { $gte: depuis } })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Shop_1.Shop.find({ createdAt: { $gte: depuis } })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);
        const activites = [
            ...dernieresCommandes.map((o) => ({
                emoji: '🛍️',
                couleur: '#3b82f6',
                titre: `Commande ${o.orderNumber}`,
                description: `${o.nomClient ?? o.customer?.name ?? 'Client'} — ${new Intl.NumberFormat('fr-FR').format(o.total)} FCFA`,
                temps: tempsRelatif(o.createdAt),
                date: o.createdAt,
            })),
            ...dernieresBoutiques.map((s) => ({
                emoji: '🏪',
                couleur: '#06C167',
                titre: `Nouveau marchand : ${s.name}`,
                description: `Plan ${s.planType} — ${s.subscriptionStatus}`,
                temps: tempsRelatif(s.createdAt),
                date: s.createdAt,
            })),
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8)
            .map(({ date, ...rest }) => rest);
        res.json({ success: true, data: activites });
    }
    catch (error) {
        console.error('Erreur GET /admin/activites :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /admin/shops — Liste toutes les boutiques
// ---------------------------------------------------------------------------
router.get('/shops', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', status, plan, search } = req.query;
        const filter = {};
        if (status)
            filter.subscriptionStatus = status;
        if (plan)
            filter.planType = plan;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Shop_1.Shop.countDocuments(filter);
        const shops = await Shop_1.Shop.find(filter)
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: shops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /admin/shops :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /admin/shops/:id/subscription — Modifier abonnement
// ---------------------------------------------------------------------------
router.patch('/shops/:id/subscription', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const subscriptionSchema = zod_1.z.object({
            status: zod_1.z.enum(['active', 'expired', 'suspended', 'trial']),
            planType: zod_1.z.enum(['basic', 'premium']).optional(),
            expiresAt: zod_1.z.string().datetime().optional(),
        });
        const parsed = subscriptionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const shop = await Shop_1.Shop.findById(req.params.id);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { status, planType, expiresAt } = parsed.data;
        shop.subscriptionStatus = status;
        if (planType)
            shop.planType = planType;
        if (status === 'active') {
            if (expiresAt) {
                shop.subscriptionExpiresAt = new Date(expiresAt);
            }
            else {
                // ✅ Si déjà actif avec date future, ajoute 30j à la date existante
                const base = shop.subscriptionExpiresAt && shop.subscriptionExpiresAt > new Date()
                    ? shop.subscriptionExpiresAt
                    : new Date();
                shop.subscriptionExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
            }
        }
        await shop.save();
        res.json({ success: true, data: shop, message: `Abonnement → ${status}` });
    }
    catch (error) {
        console.error('Erreur PATCH /admin/shops/:id/subscription :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /admin/shops/:id/verify — Vérifier une boutique
// ---------------------------------------------------------------------------
router.patch('/shops/:id/verify', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findByIdAndUpdate(req.params.id, { isVerified: true, verifiedAt: new Date() }, { new: true });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        res.json({ success: true, data: shop, message: 'Boutique vérifiée ✅' });
    }
    catch (error) {
        console.error('Erreur PATCH /admin/shops/:id/verify :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /admin/merchants — Liste tous les marchands
// ---------------------------------------------------------------------------
router.get('/merchants', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', search } = req.query;
        const filter = { role: 'merchant' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const total = await User_1.User.countDocuments(filter);
        const merchants = await User_1.User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: merchants,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /admin/merchants :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// DELETE /admin/shops/:id — Supprimer une boutique
// ---------------------------------------------------------------------------
router.delete('/shops/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findByIdAndDelete(req.params.id);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        await Product_1.Product.deleteMany({ shopId: req.params.id });
        res.json({ success: true, message: 'Boutique et produits supprimés' });
    }
    catch (error) {
        console.error('Erreur DELETE /admin/shops/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST /admin/create — Créer un compte admin
// ---------------------------------------------------------------------------
router.post('/create', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'name, email et password obligatoires',
            });
            return;
        }
        const existing = await User_1.User.findOne({ email });
        if (existing) {
            res.status(409).json({ success: false, message: 'Email déjà utilisé' });
            return;
        }
        const admin = await User_1.User.create({
            name, email, password, phone: '', role: 'admin',
        });
        res.status(201).json({
            success: true,
            data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
            message: 'Compte admin créé',
        });
    }
    catch (error) {
        console.error('Erreur POST /admin/create :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function tempsRelatif(date) {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60)
        return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)
        return `Il y a ${h}h`;
    return `Il y a ${Math.floor(h / 24)}j`;
}
// GET /admin/shops/:id — Détail d'une boutique
router.get('/shops/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findById(req.params.id)
            .populate('ownerId', 'name email phone')
            .lean();
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        res.json({ success: true, data: shop });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/orders — Toutes les commandes de la plateforme
router.get('/orders', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', status } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Order_1.Order.countDocuments(filter);
        const orders = await Order_1.Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /admin/orders :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/analytics?periode=7j|30j|90j
router.get('/analytics', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const jours = req.query.periode === '90j' ? 90
            : req.query.periode === '7j' ? 7
                : 30;
        const depuis = new Date();
        depuis.setDate(depuis.getDate() - jours);
        // Génère un point par jour
        const data = [];
        for (let i = jours - 1; i >= 0; i--) {
            const debut = new Date();
            debut.setDate(debut.getDate() - i);
            debut.setHours(0, 0, 0, 0);
            const fin = new Date(debut);
            fin.setHours(23, 59, 59, 999);
            const [boutiques, commandes] = await Promise.all([
                Shop_1.Shop.countDocuments({ createdAt: { $gte: debut, $lte: fin } }),
                Order_1.Order.countDocuments({ createdAt: { $gte: debut, $lte: fin } }),
            ]);
            // Revenus du jour (abonnements activés)
            const activations = await Shop_1.Shop.countDocuments({
                subscriptionStatus: 'active',
                updatedAt: { $gte: debut, $lte: fin },
            });
            data.push({
                date: debut.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                boutiques,
                commandes,
                revenus: activations * 15000, // estimation basique
            });
        }
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Erreur GET /admin/analytics :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/products — Tous les produits de la plateforme
router.get('/products', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', status, search } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (search)
            filter.name = { $regex: search, $options: 'i' };
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product_1.Product.countDocuments(filter);
        const products = await Product_1.Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        // Enrichit avec les infos de la boutique
        const enriched = await Promise.all(products.map(async (p) => {
            const shop = await Shop_1.Shop.findById(p.shopId)
                .select('name slug')
                .lean();
            return {
                ...p,
                shopName: shop?.name ?? null,
                shopSlug: shop?.slug ?? null,
            };
        }));
        // Stats globales
        const [actifs, draft, rupture] = await Promise.all([
            Product_1.Product.countDocuments({ status: 'active' }),
            Product_1.Product.countDocuments({ status: 'draft' }),
            Product_1.Product.countDocuments({ status: 'out_of_stock' }),
        ]);
        res.json({
            success: true,
            data: enriched,
            stats: { total: await Product_1.Product.countDocuments(), actifs, draft, rupture },
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /admin/products :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// DELETE /admin/products/:id
router.delete('/products/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        await Product_1.Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Produit supprimé' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// PATCH /admin/products/:id/status
router.patch('/products/:id/status', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const product = await Product_1.Product.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/notifications
router.get('/notifications', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { Notification } = await Promise.resolve().then(() => __importStar(require('../models/Notification')));
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// POST /admin/notifications
router.post('/notifications', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { titre, message, cible } = req.body;
        if (!titre || !message || !cible) {
            res.status(400).json({ success: false, message: 'Données manquantes' });
            return;
        }
        // Compte les destinataires selon la cible
        const filter = {};
        if (cible === 'marchands')
            filter.subscriptionStatus = { $in: ['active', 'trial'] };
        if (cible === 'premium')
            filter.planType = 'premium';
        if (cible === 'expires')
            filter.subscriptionStatus = 'expired';
        const envoye = await Shop_1.Shop.countDocuments(filter);
        const { Notification } = await Promise.resolve().then(() => __importStar(require('../models/Notification')));
        const notif = await Notification.create({
            titre,
            message,
            cible,
            envoye,
            createdBy: req.user.userId,
        });
        res.status(201).json({ success: true, data: notif });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// DELETE /admin/notifications/:id
router.delete('/notifications/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { Notification } = await Promise.resolve().then(() => __importStar(require('../models/Notification')));
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Notification supprimée' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/config
router.get('/config', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        // Retourne une config par défaut si pas encore sauvegardée
        res.json({
            success: true,
            data: {
                config: {
                    nomPlateforme: 'ShopEasy CI',
                    emailContact: 'contact@shopeasyci.store',
                    whatsappSupport: '+2250700000000',
                    urlPlateforme: 'https://www.shopeasyci.store',
                    maintenanceMode: false,
                    inscriptionsOuvertes: true,
                    maxProduitsBasic: 10,
                    maxPhotosBasic: 5,
                },
                tarifs: {
                    prixBasic: 15000,
                    prixPremium: 30000,
                    dureeEssai: 7,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// PATCH /admin/config
router.patch('/config', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        // Dans une vraie app, tu sauvegardes en DB
        // Ici on retourne simplement les données reçues
        res.json({
            success: true,
            data: req.body,
            message: 'Configuration sauvegardée',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/orders/:id — Détail d'une commande
router.get('/orders/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const order = await Order_1.Order.findById(req.params.id).lean();
        if (!order) {
            res.status(404).json({ success: false, message: 'Commande introuvable' });
            return;
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// PATCH /admin/orders/:id/status — Changer le statut
router.patch('/orders/:id/status', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order_1.Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) {
            res.status(404).json({ success: false, message: 'Commande introuvable' });
            return;
        }
        res.json({ success: true, data: order, message: `Statut → ${status}` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// GET /admin/stats/public — Stats publiques pour la landing page
router.get('/stats/public', async (req, res) => {
    try {
        const [totalBoutiques, totalCommandes] = await Promise.all([
            Shop_1.Shop.countDocuments({ subscriptionStatus: { $in: ['active', 'trial'] } }),
            Order_1.Order.countDocuments(),
        ]);
        res.json({ success: true, totalBoutiques, totalCommandes });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// GET /admin/leads — Liste des leads Koffi
router.get('/leads', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', status } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Lead_1.Lead.countDocuments(filter);
        const leads = await Lead_1.Lead.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// PATCH /admin/leads/:id — Changer statut lead
router.patch('/leads/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const lead = await Lead_1.Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, data: lead });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map