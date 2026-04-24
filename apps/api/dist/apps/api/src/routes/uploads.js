"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const Cloudinary_1 = require("../services/Cloudinary");
const Shop_1 = require("../models/Shop");
const router = (0, express_1.Router)();
// ─── POST /uploads/logo — Upload logo boutique ────────────────────────────────
router.post('/logo', auth_1.authenticate, auth_1.requireMerchant, (0, upload_1.handleUpload)(upload_1.uploadSingle), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
            return;
        }
        // Upload vers Cloudinary
        const url = await (0, Cloudinary_1.uploadImage)(req.file.buffer, 'logo');
        // Met à jour le logo de la boutique
        const shop = await Shop_1.Shop.findOneAndUpdate({ ownerId: req.user.userId }, { logo: url }, { new: true });
        res.json({
            success: true,
            data: { url, shop },
            message: 'Logo mis à jour',
        });
    }
    catch (error) {
        console.error('Erreur upload logo :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── POST /uploads/owner-photo — Upload photo propriétaire ───────────────────
router.post('/owner-photo', auth_1.authenticate, auth_1.requireMerchant, (0, upload_1.handleUpload)(upload_1.uploadSingle), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
            return;
        }
        const url = await (0, Cloudinary_1.uploadImage)(req.file.buffer, 'ownerPhoto');
        res.json({
            success: true,
            data: { url },
            message: 'Photo uploadée',
        });
    }
    catch (error) {
        console.error('Erreur upload owner-photo :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── POST /uploads/products — Upload photos produit (max 10) ─────────────────
router.post('/products', auth_1.authenticate, auth_1.requireMerchant, (0, upload_1.handleUpload)(upload_1.uploadMultiple), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
            return;
        }
        // Vérifie la limite photos selon le plan
        const { planType } = req.shop;
        if (planType === 'basic' && files.length > 5) {
            res.status(403).json({
                success: false,
                message: 'Plan Basic : maximum 5 photos par produit',
            });
            return;
        }
        // Upload toutes les images en parallèle
        const urls = await Promise.all(files.map((file) => (0, Cloudinary_1.uploadImage)(file.buffer, 'image')));
        res.json({
            success: true,
            data: { urls },
            message: `${urls.length} photo(s) uploadée(s)`,
        });
    }
    catch (error) {
        console.error('Erreur upload products :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── POST /uploads/video — Upload vidéo produit (Premium) ────────────────────
router.post('/video', auth_1.authenticate, auth_1.requireMerchant, (0, upload_1.handleUpload)(upload_1.uploadSingle), async (req, res) => {
    try {
        // Vérifie plan Premium
        if (req.shop.planType !== 'premium') {
            res.status(403).json({
                success: false,
                message: 'Les vidéos sont réservées au plan Premium',
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
            return;
        }
        // Vérifie que c'est bien une vidéo
        if (!req.file.mimetype.startsWith('video/')) {
            res.status(400).json({ success: false, message: 'Fichier vidéo requis' });
            return;
        }
        const url = await (0, Cloudinary_1.uploadImage)(req.file.buffer, 'video');
        res.json({
            success: true,
            data: { url },
            message: 'Vidéo uploadée',
        });
    }
    catch (error) {
        console.error('Erreur upload video :', error);
        res.status(500).json({ success: false, message: 'Erreur upload' });
    }
});
// ─── DELETE /uploads — Supprimer un fichier Cloudinary ───────────────────────
router.delete('/', auth_1.authenticate, auth_1.requireMerchant, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ success: false, message: 'URL obligatoire' });
            return;
        }
        await (0, Cloudinary_1.deleteFromCloudinary)(url);
        res.json({ success: true, message: 'Fichier supprimé' });
    }
    catch (error) {
        console.error('Erreur suppression upload :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=uploads.js.map