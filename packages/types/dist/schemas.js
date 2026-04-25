"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLeadSchema = exports.CreatePromoSchema = exports.CreateOrderSchema = exports.OrderItemSchema = exports.CreateProductSchema = exports.StockSchema = exports.VariantSchema = exports.UpdateShopSchema = exports.RegisterClientSchema = exports.LoginSchema = exports.RegisterMerchantSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// ── Auth ────────────────────────────────────────────────────────
exports.RegisterMerchantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nom trop court').max(100),
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(8, 'Mot de passe trop court'),
    phone: zod_1.z.string().min(8, 'Numéro invalide').max(20),
    shopName: zod_1.z.string().min(2, 'Nom de boutique trop court').max(100),
    shopSlug: zod_1.z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
    whatsapp: zod_1.z.string().min(8, 'Numéro WhatsApp invalide').max(20), // ← ajoute cette ligne
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(1, 'Mot de passe requis'),
});
exports.RegisterClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    phone: zod_1.z.string().min(8).max(20),
});
// ── Boutique ────────────────────────────────────────────────────
exports.UpdateShopSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    whatsapp: zod_1.z.string().min(8).max(20).optional(),
    whatsappOrderNotif: zod_1.z.boolean().optional(),
    selectedTheme: zod_1.z.string().optional(),
    about: zod_1.z.object({
        description: zod_1.z.string().max(500).optional(),
        ownerName: zod_1.z.string().max(100).optional(),
        ownerPhoto: zod_1.z.string().url().optional(),
        location: zod_1.z.string().max(200).optional(),
        workingHours: zod_1.z.string().max(200).optional(),
    }).optional(),
});
// ── Produit ─────────────────────────────────────────────────────
exports.VariantSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    options: zod_1.z.array(zod_1.z.string()).min(1),
});
exports.StockSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().min(0),
    price: zod_1.z.number().positive().optional(),
});
exports.CreateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().max(2000).optional(),
    categoryId: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('Prix invalide'),
    comparePrice: zod_1.z.number().positive().optional(),
    hasVariants: zod_1.z.boolean().default(false),
    variants: zod_1.z.array(exports.VariantSchema).default([]),
    stock: zod_1.z.array(exports.StockSchema).default([]),
    status: zod_1.z.nativeEnum(enums_1.ProductStatus).default(enums_1.ProductStatus.DRAFT),
});
// ── Commande ────────────────────────────────────────────────────
exports.OrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    name: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    quantity: zod_1.z.number().int().positive(),
    variant: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
});
exports.CreateOrderSchema = zod_1.z.object({
    shopId: zod_1.z.string(),
    items: zod_1.z.array(exports.OrderItemSchema).min(1, 'Panier vide'),
    promoCode: zod_1.z.string().optional(),
    customer: zod_1.z.object({
        name: zod_1.z.string().min(2),
        phone: zod_1.z.string().min(8),
        email: zod_1.z.string().email().optional(),
        address: zod_1.z.string().min(5),
        city: zod_1.z.string().min(2),
    }),
});
// ── Code promo ──────────────────────────────────────────────────
exports.CreatePromoSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(20).toUpperCase(),
    type: zod_1.z.nativeEnum(enums_1.PromoType),
    value: zod_1.z.number().positive(),
    minOrder: zod_1.z.number().positive().optional(),
    maxUses: zod_1.z.number().int().positive().optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
});
// ── Lead ────────────────────────────────────────────────────────
exports.CreateLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    phone: zod_1.z.string().min(8).max(20),
    email: zod_1.z.string().email().optional(),
    message: zod_1.z.string().max(500).optional(),
});
