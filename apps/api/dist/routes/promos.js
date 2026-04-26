"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const PromoCode_1 = require("../models/PromoCode");
const Shop_1 = require("../models/Shop");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── Schéma ──────────────────────────────────────────────────────────────────
const promoSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(20),
    type: zod_1.z.enum(['percent', 'fixed']),
    value: zod_1.z.number().min(1),
    minOrder: zod_1.z.number().optional(),
    maxUses: zod_1.z.number().int().optional(),
    expiresAt: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// ─── Helper — récupère la boutique du marchand connecté ──────────────────────
const getShop = async (userId) => Shop_1.Shop.findOne({ ownerId: userId });
// ─── Middleware Premium ───────────────────────────────────────────────────────
const requirePremium = async (req, res, next) => {
    const shop = await getShop(req.user.userId);
    if (!shop || shop.planType !== 'premium') {
        res.status(403).json({
            success: false,
            message: 'Les codes promo sont réservés au plan Premium',
            code: 'PREMIUM_REQUIRED',
        });
        return;
    }
    next();
};
// ─── GET /promos ──────────────────────────────────────────────────────────────
router.get('/', auth_1.authenticate, auth_1.requireMerchant, requirePremium, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const promos = await PromoCode_1.PromoCode.find({ shopId: shop._id })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: promos });
    }
    catch (error) {
        console.error('Erreur GET /promos :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── POST /promos ─────────────────────────────────────────────────────────────
router.post('/', auth_1.authenticate, auth_1.requireMerchant, requirePremium, async (req, res) => {
    try {
        const parsed = promoSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { code, type, value, minOrder, maxUses, expiresAt, isActive } = parsed.data;
        if (type === 'percent' && value > 100) {
            res.status(400).json({ success: false, message: 'Le pourcentage ne peut pas dépasser 100%' });
            return;
        }
        const codeUpper = code.toUpperCase();
        const existing = await PromoCode_1.PromoCode.findOne({ shopId: shop._id, code: codeUpper });
        if (existing) {
            res.status(409).json({ success: false, message: `Le code "${codeUpper}" existe déjà` });
            return;
        }
        const promo = await PromoCode_1.PromoCode.create({
            shopId: shop._id,
            code: codeUpper,
            type,
            value,
            minOrder: minOrder ?? null,
            maxUses: maxUses ?? null,
            expiresAt: expiresAt ?? null,
            isActive: isActive ?? true,
            usedCount: 0,
        });
        res.status(201).json({ success: true, data: promo, message: 'Code promo créé' });
    }
    catch (error) {
        console.error('Erreur POST /promos :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── PATCH /promos/:id ────────────────────────────────────────────────────────
router.patch('/:id', auth_1.authenticate, auth_1.requireMerchant, requirePremium, async (req, res) => {
    try {
        const parsed = promoSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const promo = await PromoCode_1.PromoCode.findOne({ _id: req.params.id, shopId: shop._id });
        if (!promo) {
            res.status(404).json({ success: false, message: 'Code promo introuvable' });
            return;
        }
        const { code, type, value, minOrder, maxUses, expiresAt, isActive } = parsed.data;
        if (code && code.toUpperCase() !== promo.code) {
            const existing = await PromoCode_1.PromoCode.findOne({
                shopId: shop._id,
                code: code.toUpperCase(),
                _id: { $ne: promo._id },
            });
            if (existing) {
                res.status(409).json({ success: false, message: `Le code "${code}" existe déjà` });
                return;
            }
            promo.code = code.toUpperCase();
        }
        if (type !== undefined)
            promo.type = type;
        if (value !== undefined)
            promo.value = value;
        if (minOrder !== undefined)
            promo.minOrder = minOrder;
        if (maxUses !== undefined)
            promo.maxUses = maxUses;
        if (expiresAt !== undefined)
            promo.expiresAt = new Date(expiresAt);
        if (isActive !== undefined)
            promo.isActive = isActive;
        await promo.save();
        res.json({ success: true, data: promo, message: 'Code promo mis à jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /promos/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── DELETE /promos/:id ───────────────────────────────────────────────────────
router.delete('/:id', auth_1.authenticate, auth_1.requireMerchant, requirePremium, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const promo = await PromoCode_1.PromoCode.findOneAndDelete({ _id: req.params.id, shopId: shop._id });
        if (!promo) {
            res.status(404).json({ success: false, message: 'Code promo introuvable' });
            return;
        }
        res.json({ success: true, message: 'Code promo supprimé' });
    }
    catch (error) {
        console.error('Erreur DELETE /promos/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── POST /promos/verify — Vérifier un code (public, storefront) ─────────────
router.post('/verify', async (req, res) => {
    try {
        const { code, shopId, subtotal } = req.body;
        if (!code || !shopId) {
            res.status(400).json({ success: false, message: 'Code et shopId obligatoires' });
            return;
        }
        const promo = await PromoCode_1.PromoCode.findOne({
            shopId,
            code: code.toUpperCase(),
            isActive: true,
        });
        if (!promo) {
            res.status(404).json({ success: false, message: 'Code promo invalide' });
            return;
        }
        if (promo.expiresAt && promo.expiresAt < new Date()) {
            res.status(400).json({ success: false, message: 'Ce code promo a expiré' });
            return;
        }
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            res.status(400).json({ success: false, message: "Ce code promo a atteint sa limite d'utilisation" });
            return;
        }
        if (promo.minOrder && subtotal < promo.minOrder) {
            res.status(400).json({ success: false, message: `Montant minimum requis : ${promo.minOrder} FCFA` });
            return;
        }
        const discount = promo.type === 'percent'
            ? Math.round((subtotal ?? 0) * promo.value / 100)
            : promo.value;
        res.json({ success: true, data: { code: promo.code, type: promo.type, value: promo.value, discount } });
    }
    catch (error) {
        console.error('Erreur POST /promos/verify :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=promos.js.map