"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Product_1 = require("../models/Product");
const Shop_1 = require("../models/Shop");
const Category_1 = require("../models/Category");
const auth_1 = require("../middleware/auth");
const slugify_1 = __importDefault(require("slugify"));
const ShareImage_1 = require("../services/ShareImage");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// Schémas
// ---------------------------------------------------------------------------
const variantSchema = zod_1.z.object({
    type: zod_1.z.string(),
    label: zod_1.z.string(),
    options: zod_1.z.array(zod_1.z.string()),
    images: zod_1.z.record(zod_1.z.array(zod_1.z.string())).optional(),
});
const stockSchema = zod_1.z.object({
    sku: zod_1.z.string(),
    quantity: zod_1.z.number().int().min(0),
    price: zod_1.z.number().optional(),
});
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().max(2000).optional(),
    categoryId: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0),
    comparePrice: zod_1.z.number().optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    video: zod_1.z.string().optional(),
    hasVariants: zod_1.z.boolean().optional(),
    variants: zod_1.z.array(variantSchema).optional(),
    stock: zod_1.z.array(stockSchema).optional(),
    totalStock: zod_1.z.number().int().min(0).optional(),
    status: zod_1.z.enum(['active', 'draft', 'out_of_stock']).optional(),
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const calculerStockTotal = (stock) => stock.reduce((sum, s) => sum + s.quantity, 0);
const verifierLimitesPlan = (planType, images, video) => {
    if (planType === 'basic') {
        if (images.length > 5)
            return 'Plan Basic : maximum 5 photos par produit';
        if (video)
            return 'Plan Basic : les vidéos ne sont pas disponibles';
    }
    return null;
};
const getShop = (userId) => Shop_1.Shop.findOne({ ownerId: userId });
// ---------------------------------------------------------------------------
// GET /products/shop/me — Produits du marchand connecté
// ⚠️ DOIT être avant /shop/:shopId et /:id
// ---------------------------------------------------------------------------
router.get('/shop/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { page = '1', limit = '20', status, categoryId } = req.query;
        const filter = { shopId: shop._id };
        if (status)
            filter.status = status;
        if (categoryId)
            filter.categoryId = categoryId;
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product_1.Product.countDocuments(filter);
        const products = await Product_1.Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /products/shop/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /products/shop/:shopId — Produits publics d'une boutique (storefront)
// ---------------------------------------------------------------------------
router.get('/shop/:shopId', async (req, res) => {
    try {
        const { categoryId, page = '1', limit = '20' } = req.query;
        const filter = {
            shopId: req.params.shopId,
            status: 'active',
        };
        if (categoryId)
            filter.categoryId = categoryId;
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product_1.Product.countDocuments(filter);
        const products = await Product_1.Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Erreur GET /products/shop/:shopId :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /products/:id — Détail produit public
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id).lean();
        if (!product) {
            res.status(404).json({ success: false, message: 'Produit introuvable' });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error('Erreur GET /products/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST /products — Créer un produit
// ---------------------------------------------------------------------------
router.post('/', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = productSchema.safeParse(req.body);
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
        if (shop.planType === 'basic') {
            const count = await Product_1.Product.countDocuments({ shopId: shop._id });
            if (count >= 10) {
                res.status(403).json({
                    success: false,
                    message: 'Plan Basic : maximum 10 produits. Passez en Premium pour des produits illimités.',
                    code: 'PRODUCT_LIMIT_REACHED',
                });
                return;
            }
        }
        const { name, description, categoryId, price, comparePrice, images = [], video, hasVariants = false, variants = [], stock = [], totalStock, status = 'draft', } = parsed.data;
        const erreurPlan = verifierLimitesPlan(shop.planType, images, video);
        if (erreurPlan) {
            res.status(403).json({ success: false, message: erreurPlan });
            return;
        }
        if (categoryId) {
            const cat = await Category_1.Category.findOne({ _id: categoryId, shopId: shop._id });
            if (!cat) {
                res.status(400).json({ success: false, message: 'Catégorie invalide' });
                return;
            }
        }
        let slug = (0, slugify_1.default)(name, { lower: true, strict: true, locale: 'fr' });
        const existing = await Product_1.Product.findOne({ shopId: shop._id, slug });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        const stockTotal = hasVariants
            ? calculerStockTotal(stock)
            : (totalStock ?? 0);
        const product = await Product_1.Product.create({
            shopId: shop._id,
            categoryId: categoryId ?? null,
            name,
            description: description ?? '',
            slug,
            price,
            comparePrice: comparePrice ?? null,
            images,
            video: video ?? null,
            hasVariants,
            variants,
            stock,
            totalStock: stockTotal,
            status,
        });
        res.status(201).json({ success: true, data: product, message: 'Produit créé' });
    }
    catch (error) {
        console.error('Erreur POST /products :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /products/:id — Modifier un produit
// ---------------------------------------------------------------------------
router.patch('/:id', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const parsed = productSchema.partial().safeParse(req.body);
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
        const product = await Product_1.Product.findOne({ _id: req.params.id, shopId: shop._id });
        if (!product) {
            res.status(404).json({ success: false, message: 'Produit introuvable' });
            return;
        }
        const { name, description, categoryId, price, comparePrice, images, video, hasVariants, variants, stock, totalStock, status, } = parsed.data;
        if (images || video) {
            const erreurPlan = verifierLimitesPlan(shop.planType, images ?? product.images, video ?? (product.video ?? undefined));
            if (erreurPlan) {
                res.status(403).json({ success: false, message: erreurPlan });
                return;
            }
        }
        if (name && name !== product.name) {
            product.name = name;
            let newSlug = (0, slugify_1.default)(name, { lower: true, strict: true, locale: 'fr' });
            const exists = await Product_1.Product.findOne({
                shopId: shop._id, slug: newSlug, _id: { $ne: product._id },
            });
            if (exists)
                newSlug = `${newSlug}-${Date.now()}`;
            product.slug = newSlug;
        }
        if (description !== undefined)
            product.description = description;
        if (categoryId !== undefined)
            product.categoryId = categoryId;
        if (price !== undefined)
            product.price = price;
        if (comparePrice !== undefined)
            product.comparePrice = comparePrice;
        if (images !== undefined)
            product.images = images;
        if (video !== undefined)
            product.video = video;
        if (hasVariants !== undefined)
            product.hasVariants = hasVariants;
        if (variants !== undefined)
            product.variants = variants;
        if (status !== undefined)
            product.status = status;
        if (stock !== undefined) {
            product.stock = stock;
            product.totalStock = product.hasVariants
                ? calculerStockTotal(stock)
                : (totalStock ?? product.totalStock);
        }
        else if (totalStock !== undefined) {
            product.totalStock = totalStock;
        }
        await product.save();
        res.json({ success: true, data: product, message: 'Produit mis à jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /products/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// DELETE /products/:id — Supprimer un produit
// ---------------------------------------------------------------------------
router.delete('/:id', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const product = await Product_1.Product.findOneAndDelete({ _id: req.params.id, shopId: shop._id });
        if (!product) {
            res.status(404).json({ success: false, message: 'Produit introuvable' });
            return;
        }
        res.json({ success: true, message: 'Produit supprimé' });
    }
    catch (error) {
        console.error('Erreur DELETE /products/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /products/:id/stock — Mise à jour rapide du stock
// ---------------------------------------------------------------------------
router.patch('/:id/stock', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const product = await Product_1.Product.findOne({ _id: req.params.id, shopId: shop._id });
        if (!product) {
            res.status(404).json({ success: false, message: 'Produit introuvable' });
            return;
        }
        const { stock, totalStock } = req.body;
        if (stock !== undefined) {
            product.stock = stock;
            product.totalStock = calculerStockTotal(stock);
        }
        else if (totalStock !== undefined) {
            product.totalStock = totalStock;
        }
        if (product.totalStock === 0) {
            product.status = 'out_of_stock';
        }
        else if (product.status === 'out_of_stock') {
            product.status = 'active';
        }
        await product.save();
        res.json({ success: true, data: product, message: 'Stock mis à jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /products/:id/stock :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// POST /products/:id/share-image — Génère l'image partageable
// ---------------------------------------------------------------------------
router.post('/:id/share-image', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await getShop(req.user.userId);
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const product = await Product_1.Product.findOne({ _id: req.params.id, shopId: shop._id });
        if (!product) {
            res.status(404).json({ success: false, message: 'Produit introuvable' });
            return;
        }
        if (!product.images || product.images.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Le produit doit avoir au moins une image',
            });
            return;
        }
        const shareImageUrl = await (0, ShareImage_1.generateShareImage)({
            productName: product.name,
            price: product.price,
            shopName: shop.name,
            productImage: product.images[0],
            isVerified: shop.isVerified,
        });
        product.shareImageUrl = shareImageUrl;
        await product.save();
        res.json({ success: true, data: { shareImageUrl }, message: 'Image partageable générée' });
    }
    catch (error) {
        console.error('Erreur POST /products/:id/share-image :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map