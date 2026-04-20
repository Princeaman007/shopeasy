import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Lead } from '../models/Lead';
import { Product } from '../models/Product';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ─── GET /admin/stats — Dashboard global de la plateforme ────────────────────

router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalBoutiques,
      boutiquesActives,
      boutiquesTrial,
      boutiquesExpirées,
      totalMarchands,
      totalClients,
      totalCommandes,
      totalLeads,
      leadsNouveaux,
    ] = await Promise.all([
      Shop.countDocuments(),
      Shop.countDocuments({ subscriptionStatus: 'active' }),
      Shop.countDocuments({ subscriptionStatus: 'trial' }),
      Shop.countDocuments({ subscriptionStatus: 'expired' }),
      User.countDocuments({ role: 'merchant' }),
      User.countDocuments({ role: 'client' }),
      Order.countDocuments(),
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'new' }),
    ]);

    // Chiffre d'affaires global (abonnements — à calculer manuellement ici)
    const boutiquesBasic   = await Shop.countDocuments({ planType: 'basic',   subscriptionStatus: 'active' });
    const boutiquesPremium = await Shop.countDocuments({ planType: 'premium', subscriptionStatus: 'active' });
    const mrr = (boutiquesBasic * 15000) + (boutiquesPremium * 30000);

    // Nouvelles boutiques ce mois
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const nouvellesBoutiquesMois = await Shop.countDocuments({
      createdAt: { $gte: debutMois },
    });

    res.json({
      success: true,
      data: {
        boutiques: {
          total:              totalBoutiques,
          actives:            boutiquesActives,
          trial:              boutiquesTrial,
          expirées:           boutiquesExpirées,
          basic:              boutiquesBasic,
          premium:            boutiquesPremium,
          nouvellesCeMois:    nouvellesBoutiquesMois,
        },
        utilisateurs: {
          marchands: totalMarchands,
          clients:   totalClients,
        },
        commandes: {
          total: totalCommandes,
        },
        leads: {
          total:    totalLeads,
          nouveaux: leadsNouveaux,
        },
        mrr, // Monthly Recurring Revenue en FCFA
      },
    });
  } catch (error) {
    console.error('Erreur GET /admin/stats :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /admin/shops — Liste toutes les boutiques ───────────────────────────

router.get('/shops', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      page   = '1',
      limit  = '20',
      status,
      plan,
      search,
    } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.subscriptionStatus = status;
    if (plan)   filter.planType           = plan;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Shop.countDocuments(filter);

    const shops = await Shop.find(filter)
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
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /admin/shops :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── PATCH /admin/shops/:id/subscription — Confirmer/modifier un abonnement ──

router.patch(
  '/shops/:id/subscription',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const subscriptionSchema = z.object({
        status:    z.enum(['active', 'expired', 'suspended', 'trial']),
        planType:  z.enum(['basic', 'premium']).optional(),
        expiresAt: z.string().datetime().optional(),
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

      const shop = await Shop.findById(req.params.id);
      if (!shop) {
        res.status(404).json({ success: false, message: 'Boutique introuvable' });
        return;
      }

      const { status, planType, expiresAt } = parsed.data;

      shop.subscriptionStatus = status;

      if (planType) shop.planType = planType;

      // Si activation → expire dans 30 jours par défaut
      if (status === 'active') {
        shop.subscriptionExpiresAt = expiresAt
          ? new Date(expiresAt)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      await shop.save();

      res.json({
        success: true,
        data:    shop,
        message: `Abonnement mis à jour → ${status}`,
      });
    } catch (error) {
      console.error('Erreur PATCH /admin/shops/:id/subscription :', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// ─── PATCH /admin/shops/:id/verify — Vérifier une boutique ──────────────────

router.patch('/shops/:id/verify', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    res.json({
      success: true,
      data:    shop,
      message: 'Boutique vérifiée ✅',
    });
  } catch (error) {
    console.error('Erreur PATCH /admin/shops/:id/verify :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /admin/merchants — Liste tous les marchands ─────────────────────────

router.get('/merchants', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const filter: Record<string, any> = { role: 'merchant' };
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);

    const merchants = await User.find(filter)
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
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /admin/merchants :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── DELETE /admin/shops/:id — Supprimer une boutique ────────────────────────

router.delete('/shops/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);

    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    // Supprime les produits associés
    await Product.deleteMany({ shopId: req.params.id });

    res.json({ success: true, message: 'Boutique et produits supprimés' });
  } catch (error) {
    console.error('Erreur DELETE /admin/shops/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /admin/create — Créer un compte admin ──────────────────────────────

router.post('/create', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'name, email et password obligatoires',
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email déjà utilisé' });
      return;
    }

    const admin = await User.create({
      name,
      email,
      password,
      phone: '',
      role:  'admin',
    });

    res.status(201).json({
      success: true,
      data: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
      message: 'Compte admin créé',
    });
  } catch (error) {
    console.error('Erreur POST /admin/create :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;