"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Review_1 = require("../models/Review");
const Shop_1 = require("../models/Shop");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reviewSchema = zod_1.z.object({
    nomClient: zod_1.z.string().min(2).max(50),
    note: zod_1.z.number().int().min(1).max(5),
    commentaire: zod_1.z.string().min(5).max(500),
    type: zod_1.z.enum(['produit', 'boutique']),
    productId: zod_1.z.string().optional(),
    shopSlug: zod_1.z.string(),
});
// ---------------------------------------------------------------------------
// POST /reviews — Soumettre un avis (public)
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const parsed = reviewSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, message: 'Donnees invalides', errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { nomClient, note, commentaire, type, productId, shopSlug } = parsed.data;
        const shop = await Shop_1.Shop.findOne({ slug: shopSlug });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const review = await Review_1.Review.create({
            shopId: shop._id,
            productId: productId ?? null,
            nomClient,
            note,
            commentaire,
            type,
            statut: 'pending',
        });
        res.status(201).json({ success: true, data: review, message: 'Avis soumis — en attente de validation' });
    }
    catch (error) {
        console.error('Erreur POST /reviews :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /reviews/public/:shopSlug — Avis approuves d'une boutique (public)
// ---------------------------------------------------------------------------
router.get('/public/:shopSlug', async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ slug: req.params.shopSlug });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { type, productId } = req.query;
        const filter = { shopId: shop._id, statut: 'approved' };
        if (type)
            filter.type = type;
        if (productId)
            filter.productId = productId;
        const avis = await Review_1.Review.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        // Calcul moyenne
        const moyenne = avis.length > 0
            ? avis.reduce((s, a) => s + a.note, 0) / avis.length
            : 0;
        res.json({ success: true, data: avis, moyenne: Math.round(moyenne * 10) / 10, total: avis.length });
    }
    catch (error) {
        console.error('Erreur GET /reviews/public :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// GET /reviews/me — Avis du marchand (dashboard)
// ---------------------------------------------------------------------------
router.get('/me', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ ownerId: req.user.userId });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { statut } = req.query;
        const filter = { shopId: shop._id };
        if (statut)
            filter.statut = statut;
        const avis = await Review_1.Review.find(filter)
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: avis });
    }
    catch (error) {
        console.error('Erreur GET /reviews/me :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// PATCH /reviews/:id — Approuver ou rejeter un avis (marchand)
// ---------------------------------------------------------------------------
router.patch('/:id', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ ownerId: req.user.userId });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        const { statut } = req.body;
        if (!['approved', 'rejected'].includes(statut)) {
            res.status(400).json({ success: false, message: 'Statut invalide' });
            return;
        }
        const review = await Review_1.Review.findOneAndUpdate({ _id: req.params.id, shopId: shop._id }, { statut }, { new: true });
        if (!review) {
            res.status(404).json({ success: false, message: 'Avis introuvable' });
            return;
        }
        res.json({ success: true, data: review, message: statut === 'approved' ? 'Avis approuve' : 'Avis rejete' });
    }
    catch (error) {
        console.error('Erreur PATCH /reviews/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ---------------------------------------------------------------------------
// DELETE /reviews/:id — Supprimer un avis (marchand)
// ---------------------------------------------------------------------------
router.delete('/:id', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const shop = await Shop_1.Shop.findOne({ ownerId: req.user.userId });
        if (!shop) {
            res.status(404).json({ success: false, message: 'Boutique introuvable' });
            return;
        }
        await Review_1.Review.findOneAndDelete({ _id: req.params.id, shopId: shop._id });
        res.json({ success: true, message: 'Avis supprime' });
    }
    catch (error) {
        console.error('Erreur DELETE /reviews/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=reviews.js.map