"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const Product_1 = require("../models/Product");
const auth_1 = require("../middleware/auth");
const OrderAttachment_1 = require("../services/OrderAttachment");
const router = (0, express_1.Router)();
/**
 * GET ${process.env.NEXT_PUBLIC_API_URL}/users/favoris
 * Retourne les produits favoris du client connecté
 */
router.get('/favoris', auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.userId).select('favorites');
        if (!user) {
            res.status(404).json({ message: 'Utilisateur introuvable' });
            return;
        }
        const favoris = await Product_1.Product.find({
            _id: { $in: user.favorites },
            status: { $ne: 'draft' },
        })
            .populate('shopId', 'name slug')
            .select('name price comparePrice images slug status shopId')
            .lean();
        res.json({ favoris });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * POST ${process.env.NEXT_PUBLIC_API_URL}/users/favoris/:productId
 * Ajoute un produit aux favoris
 */
router.post('/favoris/:productId', auth_1.authenticate, async (req, res) => {
    try {
        await User_1.User.findByIdAndUpdate(req.user.userId, { $addToSet: { favorites: req.params.productId } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * DELETE ${process.env.NEXT_PUBLIC_API_URL}/users/favoris/:productId
 * Retire un produit des favoris
 */
router.delete('/favoris/:productId', auth_1.authenticate, async (req, res) => {
    try {
        await User_1.User.findByIdAndUpdate(req.user.userId, { $pull: { favorites: req.params.productId } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * GET ${process.env.NEXT_PUBLIC_API_URL}/users/adresses
 */
router.get('/adresses', auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.userId).select('savedAddresses');
        res.json({ adresses: user?.savedAddresses || [] });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * POST ${process.env.NEXT_PUBLIC_API_URL}/users/adresses
 */
router.post('/adresses', auth_1.authenticate, async (req, res) => {
    try {
        const { label, address, city, phone } = req.body;
        const user = await User_1.User.findByIdAndUpdate(req.user.userId, { $push: { savedAddresses: { label, address, city, phone } } }, { new: true }).select('savedAddresses');
        res.json({ adresses: user?.savedAddresses || [] });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * PUT ${process.env.NEXT_PUBLIC_API_URL}/users/adresses/:id
 */
router.put('/adresses/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { label, address, city, phone } = req.body;
        const user = await User_1.User.findOneAndUpdate({ _id: req.user.userId, 'savedAddresses._id': req.params.id }, {
            $set: {
                'savedAddresses.$.label': label,
                'savedAddresses.$.address': address,
                'savedAddresses.$.city': city,
                'savedAddresses.$.phone': phone,
            },
        }, { new: true }).select('savedAddresses');
        res.json({ adresses: user?.savedAddresses || [] });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * DELETE ${process.env.NEXT_PUBLIC_API_URL}/users/adresses/:id
 */
router.delete('/adresses/:id', auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findByIdAndUpdate(req.user.userId, { $pull: { savedAddresses: { _id: req.params.id } } }, { new: true }).select('savedAddresses');
        res.json({ adresses: user?.savedAddresses || [] });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * PUT ${process.env.NEXT_PUBLIC_API_URL}/users/profil
 * Mise à jour nom et téléphone
 */
router.put('/profil', auth_1.authenticate, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const update = {};
        if (name?.trim())
            update.name = name.trim();
        if (phone?.trim())
            update.phone = phone.trim();
        const user = await User_1.User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true }).select('-password');
        res.json({ success: true, user });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * PUT ${process.env.NEXT_PUBLIC_API_URL}/users/changer-mot-de-passe
 */
router.put('/changer-mot-de-passe', auth_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Champs obligatoires manquants' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ message: 'Minimum 6 caractères' });
            return;
        }
        const user = await User_1.User.findById(req.user.userId).select('+password');
        if (!user) {
            res.status(404).json({ message: 'Utilisateur introuvable' });
            return;
        }
        const valide = await user.comparePassword(currentPassword);
        if (!valide) {
            res.status(401).json({ message: 'Mot de passe actuel incorrect' });
            return;
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Mot de passe modifié' });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/**
 * POST ${process.env.NEXT_PUBLIC_API_URL}/users/rattacher-commandes
 * Rattachement manuel — utile si le client se connecte après avoir commandé
 */
router.post('/rattacher-commandes', auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.userId).select('email');
        if (!user) {
            res.status(404).json({ message: 'Utilisateur introuvable' });
            return;
        }
        const count = await (0, OrderAttachment_1.rattacherCommandesInvite)(req.user.userId, user.email);
        res.json({ success: true, commandesRattachees: count });
    }
    catch {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map