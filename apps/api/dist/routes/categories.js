"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Category_1 = require("../models/Category");
const Shop_1 = require("../models/Shop");
const auth_1 = require("../middleware/auth");
const slugify_1 = __importDefault(require("slugify"));
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(60),
    icon: zod_1.z.string().max(10).optional(),
    parentId: zod_1.z.string().optional().nullable(),
    order: zod_1.z.number().optional(),
});
const getShop = async (userId, shopId) => {
    if (shopId)
        return Shop_1.Shop.findById(shopId);
    return Shop_1.Shop.findOne({ $or: [{ ownerId: userId }, { admins: userId }] });
};
// ---------------------------------------------------------------------------
// GET /categories/shop/me — Catégories du marchand connecté
// ⚠️ DOIT être avant /:id
// ---------------------------------------------------------------------------
router.get('/shop/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId, req.shop?.id);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const categories = await Category_1.Category.find({ shopId: shop._id })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        res.json({ success: true, data: categories });
    }
    catch (error) {
        console.error('Erreur GET /categories/shop/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /categories/shop/:shopId — Catégories publiques d'une boutique (storefront)
// ---------------------------------------------------------------------------
router.get('/shop/:shopId', async (req, res) => {
    try {
        const categories = await Category_1.Category.find({ shopId: req.params.shopId })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        res.json({ success: true, data: categories });
    }
    catch (error) {
        console.error('Erreur GET /categories/shop/:shopId :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST /categories — Créer une catégorie custom
// ---------------------------------------------------------------------------
router.post('/', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = categorySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const shop = await getShop(req.user.userId, req.shop?.id);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { name, icon, parentId, order } = parsed.data;
        let slug = (0, slugify_1.default)(name, { lower: true, strict: true, locale: 'fr' });
        const existing = await Category_1.Category.findOne({ shopId: shop._id, slug });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        const count = await Category_1.Category.countDocuments({ shopId: shop._id });
        const category = await Category_1.Category.create({
            shopId: shop._id,
            name,
            slug,
            icon: icon ?? '📦',
            parentId: parentId ?? null,
            order: order ?? count + 1,
            predefined: false,
        });
        res.status(201).json({ success: true, data: category, message: 'Catégorie créée' });
    }
    catch (error) {
        console.error('Erreur POST /categories :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /categories/:id — Modifier une catégorie
// ---------------------------------------------------------------------------
router.patch('/:id', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = categorySchema.partial().safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const shop = await getShop(req.user.userId, req.shop?.id);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const category = await Category_1.Category.findOne({ _id: req.params.id, shopId: shop._id });
        if (!category) {
            res.status(404).json({ success: false, message: 'Catégorie introuvable' });
            return;
        }
        const { name, icon, parentId, order } = parsed.data;
        if (name && name !== category.name) {
            category.name = name;
            category.slug = (0, slugify_1.default)(name, { lower: true, strict: true, locale: 'fr' });
        }
        if (icon !== undefined)
            category.icon = icon;
        if (parentId !== undefined)
            category.parentId = parentId;
        if (order !== undefined)
            category.order = order;
        await category.save();
        res.json({ success: true, data: category, message: 'Catégorie mise à jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /categories/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// DELETE /categories/:id — Supprimer une catégorie custom
// ---------------------------------------------------------------------------
router.delete('/:id', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId, req.shop?.id);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const category = await Category_1.Category.findOne({ _id: req.params.id, shopId: shop._id });
        if (!category) {
            res.status(404).json({ success: false, message: 'Catégorie introuvable' });
            return;
        }
        if (category.predefined) {
            res.status(403).json({
                success: false,
                message: 'Les catégories prédéfinies ne peuvent pas être supprimées',
            });
            return;
        }
        await category.deleteOne();
        res.json({ success: true, message: 'Catégorie supprimée' });
    }
    catch (error) {
        console.error('Erreur DELETE /categories/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map