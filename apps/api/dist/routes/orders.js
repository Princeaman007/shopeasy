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
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const Shop_1 = require("../models/Shop");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const Email_1 = require("../services/Email");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// Schémas
// ---------------------------------------------------------------------------
const itemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
    quantity: zod_1.z.number().int().min(1),
    variants: zod_1.z.record(zod_1.z.string()).optional(),
    variant: zod_1.z.string().optional(),
    image: zod_1.z.string().optional().nullable(),
});
const createOrderSchema = zod_1.z.object({
    shopId: zod_1.z.string(),
    items: zod_1.z.array(itemSchema).min(1),
    nomClient: zod_1.z.string().min(2).optional(),
    telephone: zod_1.z.string().min(8).optional(),
    adresse: zod_1.z.string().optional(),
    ville: zod_1.z.string().optional(),
    modeLivraison: zod_1.z.enum(['livraison', 'retrait']).optional(),
    notes: zod_1.z.string().optional(),
    subtotal: zod_1.z.number().optional(),
    total: zod_1.z.number().optional(),
    promoCode: zod_1.z.string().optional(),
    discount: zod_1.z.number().optional(),
    customer: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100),
        phone: zod_1.z.string().min(8).max(20),
        email: zod_1.z.string().email().optional(),
        address: zod_1.z.string().min(5).max(300),
        city: zod_1.z.string().min(2).max(100),
    }).optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['confirmed', 'shipping', 'delivered', 'cancelled']),
    note: zod_1.z.string().optional(),
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const genererNumeroCommande = async () => {
    const annee = new Date().getFullYear();
    const count = await Order_1.Order.countDocuments();
    const numero = String(count + 1).padStart(4, '0');
    return `SEC-${annee}-${numero}`;
};
const getShop = (userId, shopId) => Shop_1.Shop.findOne({ ownerId: userId }).then(shop => shop ? shop : shopId ? Shop_1.Shop.findById(shopId) : null);
// ---------------------------------------------------------------------------
// POST /orders — Créer une commande (public, storefront)
// ---------------------------------------------------------------------------
router.post('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const parsed = createOrderSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const { shopId, items, promoCode, nomClient, telephone, adresse, ville, modeLivraison, notes, subtotal: subtotalFront, total: totalFront, discount: discountFront, customer, } = parsed.data;
        const shop = await Shop_1.Shop.findById(shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        if (shop.subscriptionStatus === 'expired' || shop.subscriptionStatus === 'suspended') {
            res.status(403).json({
                success: false,
                message: 'Cette boutique est temporairement indisponible',
            });
            return;
        }
        const orderItems = [];
        let subtotal = 0;
        for (const item of items) {
            if (item.price && item.name) {
                subtotal += item.price * item.quantity;
                orderItems.push({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    variant: item.variant ?? '',
                    variants: item.variants ?? {},
                    image: item.image ?? '',
                });
                await Product_1.Product.findByIdAndUpdate(item.productId, {
                    $inc: { totalStock: -item.quantity },
                });
                continue;
            }
            const product = await Product_1.Product.findOne({
                _id: item.productId, shopId, status: 'active',
            });
            if (!product) {
                res.status(400).json({ success: false, message: `Produit introuvable : ${item.productId}` });
                return;
            }
            if (product.totalStock < item.quantity) {
                res.status(400).json({ success: false, message: `Stock insuffisant pour : ${product.name}` });
                return;
            }
            subtotal += product.price * item.quantity;
            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                variant: item.variant ?? '',
                variants: item.variants ?? {},
                image: product.images[0] ?? '',
            });
            product.totalStock -= item.quantity;
            if (product.totalStock === 0)
                product.status = 'out_of_stock';
            await product.save();
        }
        let discount = discountFront ?? 0;
        let promoApplique = '';
        if (promoCode && shop.planType === 'premium' && !discount) {
            const { PromoCode } = await Promise.resolve().then(() => __importStar(require('../models/PromoCode')));
            const promo = await PromoCode.findOne({
                shopId, code: promoCode.toUpperCase(), isActive: true,
            });
            if (promo) {
                const nonExpire = !promo.expiresAt || promo.expiresAt > new Date();
                const sousLimite = !promo.maxUses || promo.usedCount < promo.maxUses;
                const montantOk = !promo.minOrder || subtotal >= promo.minOrder;
                if (nonExpire && sousLimite && montantOk) {
                    discount = promo.type === 'percent'
                        ? Math.round(subtotal * promo.value / 100)
                        : promo.value;
                    promo.usedCount += 1;
                    await promo.save();
                    promoApplique = promo.code;
                }
            }
        }
        const total = totalFront ?? Math.max(0, subtotal - discount);
        const orderNumber = await genererNumeroCommande();
        const clientNom = nomClient ?? customer?.name ?? '';
        const clientTel = telephone ?? customer?.phone ?? '';
        const clientAdr = adresse ?? customer?.address ?? '';
        const clientVille = ville ?? customer?.city ?? '';
        const order = await Order_1.Order.create({
            shopId,
            customerId: req.user?.userId ?? null,
            orderNumber,
            items: orderItems,
            promoCode: promoApplique,
            discount,
            subtotal,
            total,
            nomClient: clientNom,
            telephone: clientTel,
            adresse: clientAdr,
            ville: clientVille,
            modeLivraison: modeLivraison ?? 'livraison',
            notes: notes ?? '',
            customer: {
                name: clientNom,
                phone: clientTel,
                address: clientAdr,
                city: clientVille,
                isGuest: !req.user,
            },
            status: 'new',
            statusHistory: [{ status: 'new', date: new Date(), note: 'Commande passée' }],
            smsSent: false,
            waNotifSent: false,
        });
        // Email au marchand
        try {
            const merchant = await User_1.User.findOne({ _id: shop.ownerId }).select('email name');
            if (merchant?.email) {
                await (0, Email_1.sendOrderNotificationEmail)(merchant.email, merchant.name, {
                    orderNumber: order.orderNumber,
                    customerName: clientNom,
                    customerPhone: clientTel,
                    total: order.total,
                    items: orderItems.map(i => ({
                        name: i.name, quantity: i.quantity, price: i.price,
                    })),
                });
            }
        }
        catch (emailErr) {
            console.error('Erreur email marchand:', emailErr);
        }
        // Email au client si email fourni
        try {
            const customerEmail = customer?.email;
            if (customerEmail) {
                await (0, Email_1.sendOrderConfirmationEmail)(customerEmail, clientNom, {
                    orderNumber: order.orderNumber,
                    shopName: shop.name,
                    total: order.total,
                    items: orderItems.map(i => ({
                        name: i.name, quantity: i.quantity, price: i.price,
                    })),
                    address: clientAdr,
                    city: clientVille,
                });
            }
        }
        catch (emailErr) {
            console.error('Erreur email client:', emailErr);
        }
        res.status(201).json({
            success: true,
            data: order,
            message: 'Commande créée avec succès',
        });
    }
    catch (error) {
        console.error('Erreur POST /orders :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /orders/mes-commandes
// ---------------------------------------------------------------------------
router.get('/mes-commandes', auth_1.authenticate, async (req, res) => {
    try {
        const commandes = await Order_1.Order.find({ customerId: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ orders: commandes });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /orders/shop/me — Commandes du marchand
// ---------------------------------------------------------------------------
router.get('/shop/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { page = '1', limit = '20', status } = req.query;
        const filter = { shopId: shop._id };
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
        console.error('Erreur GET /orders/shop/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /orders/shop/me/stats
// ---------------------------------------------------------------------------
router.get('/shop/me/stats', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const shopId = shop._id;
        const [total, nouvelles, confirmées, enLivraison, livrées, annulées] = await Promise.all([
            Order_1.Order.countDocuments({ shopId }),
            Order_1.Order.countDocuments({ shopId, status: 'new' }),
            Order_1.Order.countDocuments({ shopId, status: 'confirmed' }),
            Order_1.Order.countDocuments({ shopId, status: 'shipping' }),
            Order_1.Order.countDocuments({ shopId, status: 'delivered' }),
            Order_1.Order.countDocuments({ shopId, status: 'cancelled' }),
        ]);
        const ca = await Order_1.Order.aggregate([
            { $match: { shopId, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        res.json({
            success: true,
            data: { total, nouvelles, confirmées, enLivraison, livrées, annulées, chiffreAffaires: ca[0]?.total ?? 0 },
        });
    }
    catch (error) {
        console.error('Erreur GET /orders/shop/me/stats :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /orders/client/me
// ---------------------------------------------------------------------------
router.get('/client/me', auth_1.authenticate, async (req, res) => {
    try {
        const orders = await Order_1.Order.find({ customerId: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: orders });
    }
    catch (error) {
        console.error('Erreur GET /orders/client/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /orders/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const order = await Order_1.Order.findById(req.params.id).lean();
        if (!order) {
            res.status(404).json({ success: false, message: 'Commande introuvable' });
            return;
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        console.error('Erreur GET /orders/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /orders/:id/status — Mettre à jour le statut (marchand)
// ---------------------------------------------------------------------------
router.patch('/:id/status', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Statut invalide',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const shop = await getShop(req.user.userId, req.user.shopId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const order = await Order_1.Order.findOne({ _id: req.params.id, shopId: shop._id });
        if (!order) {
            res.status(404).json({ success: false, message: 'Commande introuvable' });
            return;
        }
        const { status, note } = parsed.data;
        const transitions = {
            new: ['confirmed', 'cancelled'],
            confirmed: ['shipping', 'cancelled'],
            shipping: ['delivered', 'cancelled'],
            delivered: [],
            cancelled: [],
        };
        if (!transitions[order.status]?.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Transition invalide : ${order.status} → ${status}`,
            });
            return;
        }
        order.status = status;
        order.statusHistory.push({ status, date: new Date(), note: note ?? '' });
        await order.save();
        // Email au client si email fourni
        try {
            const customerEmail = order.customer?.email;
            const customerName = order.nomClient ?? order.customer?.name ?? '';
            if (customerEmail) {
                await (0, Email_1.sendOrderStatusEmail)(customerEmail, customerName, {
                    orderNumber: order.orderNumber,
                    shopName: shop.name,
                    status,
                    total: order.total,
                });
            }
        }
        catch (emailErr) {
            console.error('Erreur email statut:', emailErr);
        }
        res.json({ success: true, data: order, message: `Commande ${status}` });
    }
    catch (error) {
        console.error('Erreur PATCH /orders/:id/status :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map