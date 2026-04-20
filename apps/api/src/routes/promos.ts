import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PromoCode } from '../models/PromoCode';
import { authenticate, requireMerchant } from '../middleware/auth';

const router = Router();

// ─── Schéma de validation ────────────────────────────────────────────────────

const promoSchema = z.object({
  code:      z.string().min(3).max(20).toUpperCase(),
  type:      z.enum(['percent', 'fixed']),
  value:     z.number().min(1),
  minOrder:  z.number().optional(),
  maxUses:   z.number().int().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive:  z.boolean().optional(),
});

// ─── Middleware Premium ───────────────────────────────────────────────────────

/**
 * Vérifie que le marchand est sur le plan Premium
 */
const requirePremium = (req: Request, res: Response, next: Function) => {
  if (req.shop!.planType !== 'premium') {
    res.status(403).json({
      success: false,
      message: 'Les codes promo sont réservés au plan Premium',
      code: 'PREMIUM_REQUIRED',
    });
    return;
  }
  next();
};

// ─── GET /promos — Liste des codes promo du marchand ─────────────────────────

router.get('/', authenticate, requireMerchant, requirePremium, async (req: Request, res: Response) => {
  try {
    const promos = await PromoCode.find({ shopId: req.shop!.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: promos });
  } catch (error) {
    console.error('Erreur GET /promos :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /promos — Créer un code promo ──────────────────────────────────────

router.post('/', authenticate, requireMerchant, requirePremium, async (req: Request, res: Response) => {
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

    const { code, type, value, minOrder, maxUses, expiresAt, isActive } = parsed.data;

    // Vérifie la validation du pourcentage
    if (type === 'percent' && value > 100) {
      res.status(400).json({
        success: false,
        message: 'Le pourcentage ne peut pas dépasser 100%',
      });
      return;
    }

    // Vérifie que le code n'existe pas déjà pour cette boutique
    const existing = await PromoCode.findOne({
      shopId: req.shop!.id,
      code:   code.toUpperCase(),
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Le code "${code}" existe déjà`,
      });
      return;
    }

    const promo = await PromoCode.create({
      shopId:    req.shop!.id,
      code:      code.toUpperCase(),
      type,
      value,
      minOrder:  minOrder  ?? null,
      maxUses:   maxUses   ?? null,
      expiresAt: expiresAt ?? null,
      isActive:  isActive  ?? true,
      usedCount: 0,
    });

    res.status(201).json({
      success: true,
      data:    promo,
      message: 'Code promo créé',
    });
  } catch (error) {
    console.error('Erreur POST /promos :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── PATCH /promos/:id — Modifier un code promo ──────────────────────────────

router.patch('/:id', authenticate, requireMerchant, requirePremium, async (req: Request, res: Response) => {
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

    const promo = await PromoCode.findOne({
      _id:    req.params.id,
      shopId: req.shop!.id,
    });

    if (!promo) {
      res.status(404).json({ success: false, message: 'Code promo introuvable' });
      return;
    }

    const { code, type, value, minOrder, maxUses, expiresAt, isActive } = parsed.data;

    // Vérifie l'unicité du nouveau code
    if (code && code !== promo.code) {
      const existing = await PromoCode.findOne({
        shopId: req.shop!.id,
        code:   code.toUpperCase(),
        _id:    { $ne: promo._id },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Le code "${code}" existe déjà`,
        });
        return;
      }
      promo.code = code.toUpperCase();
    }

    if (type      !== undefined) promo.type      = type;
    if (value     !== undefined) promo.value     = value;
    if (minOrder  !== undefined) promo.minOrder  = minOrder;
    if (maxUses   !== undefined) promo.maxUses   = maxUses;
    if (expiresAt !== undefined) promo.expiresAt = new Date(expiresAt);
    if (isActive  !== undefined) promo.isActive  = isActive;

    await promo.save();

    res.json({ success: true, data: promo, message: 'Code promo mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH /promos/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── DELETE /promos/:id — Supprimer un code promo ────────────────────────────

router.delete('/:id', authenticate, requireMerchant, requirePremium, async (req: Request, res: Response) => {
  try {
    const promo = await PromoCode.findOneAndDelete({
      _id:    req.params.id,
      shopId: req.shop!.id,
    });

    if (!promo) {
      res.status(404).json({ success: false, message: 'Code promo introuvable' });
      return;
    }

    res.json({ success: true, message: 'Code promo supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /promos/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /promos/verify — Vérifier un code promo (public) ───────────────────

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { code, shopId, subtotal } = req.body;

    if (!code || !shopId) {
      res.status(400).json({
        success: false,
        message: 'Code et shopId obligatoires',
      });
      return;
    }

    const promo = await PromoCode.findOne({
      shopId,
      code:     code.toUpperCase(),
      isActive: true,
    });

    if (!promo) {
      res.status(404).json({
        success: false,
        message: 'Code promo invalide',
      });
      return;
    }

    // Vérifie expiration
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Ce code promo a expiré',
      });
      return;
    }

    // Vérifie le nombre d'utilisations
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      res.status(400).json({
        success: false,
        message: 'Ce code promo a atteint sa limite d\'utilisation',
      });
      return;
    }

    // Vérifie le montant minimum
    if (promo.minOrder && subtotal < promo.minOrder) {
      res.status(400).json({
        success: false,
        message: `Montant minimum requis : ${promo.minOrder} FCFA`,
      });
      return;
    }

    // Calcule la réduction
    const discount = promo.type === 'percent'
      ? Math.round((subtotal ?? 0) * promo.value / 100)
      : promo.value;

    res.json({
      success: true,
      data: {
        code:     promo.code,
        type:     promo.type,
        value:    promo.value,
        discount,
      },
    });
  } catch (error) {
    console.error('Erreur POST /promos/verify :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;