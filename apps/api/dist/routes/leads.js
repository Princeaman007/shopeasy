"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Lead_1 = require("../models/Lead");
const auth_1 = require("../middleware/auth");
const Email_1 = require("../services/Email");
const router = (0, express_1.Router)();
// ─── Schéma de validation ────────────────────────────────────────────────────
const leadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    phone: zod_1.z.string().min(8).max(20),
    email: zod_1.z.string().email().optional(),
    message: zod_1.z.string().max(1000).optional(),
});
// ─── POST /leads — Créer un lead (appelé par Koffi) ──────────────────────────
router.post('/', async (req, res) => {
    try {
        const parsed = leadSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const { name, phone, email, message } = parsed.data;
        // Vérifie si le lead existe déjà (même téléphone)
        const existing = await Lead_1.Lead.findOne({ phone });
        if (existing) {
            existing.name = name;
            if (email)
                existing.email = email;
            if (message)
                existing.message = message;
            await existing.save();
            res.json({
                success: true,
                data: existing,
                message: 'Lead mis à jour',
            });
            return;
        }
        const lead = await Lead_1.Lead.create({
            name,
            phone,
            email: email ?? '',
            message: message ?? '',
            status: 'new',
        });
        // Notifie l'admin par email (non bloquant)
        (0, Email_1.sendLeadNotificationEmail)({
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            message: lead.message,
        }).catch((err) => {
            console.error('Erreur notification email lead :', err);
        });
        res.status(201).json({
            success: true,
            data: lead,
            message: 'Lead enregistré',
        });
    }
    catch (error) {
        console.error('Erreur POST /leads :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── GET /leads — Liste des leads (admin uniquement) ─────────────────────────
router.get('/', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20', status, } = req.query;
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
        console.error('Erreur GET /leads :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── PATCH /leads/:id/status — Mettre à jour le statut d'un lead (admin) ─────
router.patch('/:id/status', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'contacted', 'converted'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Statut invalide — valeurs : new, contacted, converted',
            });
            return;
        }
        const lead = await Lead_1.Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead introuvable' });
            return;
        }
        res.json({ success: true, data: lead, message: 'Statut mis à jour' });
    }
    catch (error) {
        console.error('Erreur PATCH /leads/:id/status :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
// ─── DELETE /leads/:id — Supprimer un lead (admin) ───────────────────────────
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const lead = await Lead_1.Lead.findByIdAndDelete(req.params.id);
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead introuvable' });
            return;
        }
        res.json({ success: true, message: 'Lead supprimé' });
    }
    catch (error) {
        console.error('Erreur DELETE /leads/:id :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=leads.js.map