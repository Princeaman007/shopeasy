import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Shop } from '../models/Shop';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { authenticate, requireMerchant } from '../middleware/auth';
import { ShopService } from '../services/ShopService';
import slugify from 'slugify';

const router = Router();

// ─── Schémas de validation ───────────────────────────────────────────────────

const updateShopSchema = z.object({
  name:                z.string().min(2).max(60).optional(),
  whatsapp:            z.string().min(8).max(20).optional(),
  whatsappOrderNotif:  z.boolean().optional(),
  selectedTheme:       z.string().optional(),
});

const updateAboutSchema = z.object({
  description:  z.string().max(1000).optional(),
  ownerName:    z.string().max(100).optional(),
  ownerPhoto:   z.string().url().optional(),
  location:     z.string().max(200).optional(),
  workingHours: z.string().max(200).optional(),
});

// ─── GET /shops/me — Récupère la boutique du marchand connecté ───────────────

router.get('/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user!.userId })
      .select('-__v')
      .lean();

    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    res.json({ success: true, data: shop });
  } catch (error) {
    console.error('Erreur GET /shops/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /shops/:slug — Boutique publique (storefront) ───────────────────────



// ─── PATCH /shops/me — Met à jour les infos de la boutique ──────────────────

router.patch('/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = updateShopSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const { name, whatsapp, whatsappOrderNotif, selectedTheme } = parsed.data;

    // Mise à jour du nom + nouveau slug si le nom change
    if (name && name !== shop.name) {
      shop.name = name;
      shop.slug = await ShopService.generateUniqueSlug(name);
    }

    if (whatsapp !== undefined)            shop.whatsapp = whatsapp;
    if (whatsappOrderNotif !== undefined)  shop.whatsappOrderNotif = whatsappOrderNotif;

    // Validation du thème selon le plan
    if (selectedTheme) {
      const THEMES_BASIC   = ['vitrine-moderne', 'marche-colore'];
      const THEMES_PREMIUM = [...THEMES_BASIC, 'luxe-sombre', 'boutique-pro', 'stories-style'];
      const themesAutorisés = shop.planType === 'premium' ? THEMES_PREMIUM : THEMES_BASIC;

      if (!themesAutorisés.includes(selectedTheme)) {
        res.status(403).json({
          success: false,
          message: `Thème non disponible sur votre plan (${shop.planType})`,
        });
        return;
      }

      shop.selectedTheme = selectedTheme;
    }

    await shop.save();

    res.json({ success: true, data: shop, message: 'Boutique mise à jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── PATCH /shops/me/about — Met à jour la page À propos ────────────────────

router.patch('/me/about', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = updateAboutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const shop = await Shop.findOneAndUpdate(
      { ownerId: req.user!.userId },
      { $set: { about: parsed.data } },
      { new: true, select: '-__v' }
    );

    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    res.json({ success: true, data: shop, message: 'Page À propos mise à jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me/about :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /shops/me/stats — Statistiques basiques de la boutique ─────────────

router.get('/me/stats', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const [totalProduits, totalCategories] = await Promise.all([
      Product.countDocuments({ shopId: shop._id, status: 'active' }),
      Category.countDocuments({ shopId: shop._id }),
    ]);

    res.json({
      success: true,
      data: {
        totalProduits,
        totalCategories,
        planType: shop.planType,
        subscriptionStatus: shop.subscriptionStatus,
        subscriptionExpiresAt: shop.subscriptionExpiresAt,
        isVerified: shop.isVerified,
      },
    });
  } catch (error) {
    console.error('Erreur GET /shops/me/stats :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug })
      .select('-__v')
      .lean();

    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    // Vérifie que la boutique est active
    if (
      shop.subscriptionStatus === 'expired' ||
      shop.subscriptionStatus === 'suspended'
    ) {
      res.status(403).json({
        success: false,
        message: 'Cette boutique est temporairement indisponible',
      });
      return;
    }

    res.json({ success: true, data: shop });
  } catch (error) {
    console.error('Erreur GET /shops/:slug :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;