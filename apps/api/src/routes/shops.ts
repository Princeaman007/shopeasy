import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Shop } from '../models/Shop';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { authenticate, requireMerchant } from '../middleware/auth';
import { ShopService } from '../services/ShopService';

// ---------------------------------------------------------------------------
// Configuration multer + Cloudinary
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// ---------------------------------------------------------------------------
// Schémas Zod
// ---------------------------------------------------------------------------
const updateShopSchema = z.object({
  name:               z.string().min(2).max(60).optional(),
  whatsapp:           z.string().min(8).max(20).optional(),
  whatsappOrderNotif: z.boolean().optional(),
  logo:               z.string().optional(),
});

const updateAboutSchema = z.object({
  description:  z.string().max(1000).optional(),
  ownerName:    z.string().max(100).optional(),
  ownerPhoto:   z.string().optional(),
  location:     z.string().max(200).optional(),
  workingHours: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Helper upload Cloudinary depuis buffer
// ---------------------------------------------------------------------------
const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  transformation: object[]
): Promise<any> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(buffer);
  });

// ---------------------------------------------------------------------------
// GET /shops/me — Boutique du marchand connecté
// ⚠️ DOIT être avant /:slug
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /shops/me/stats — Stats basiques
// ---------------------------------------------------------------------------
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
        planType:              shop.planType,
        subscriptionStatus:    shop.subscriptionStatus,
        subscriptionExpiresAt: shop.subscriptionExpiresAt,
        isVerified:            shop.isVerified,
      },
    });
  } catch (error) {
    console.error('Erreur GET /shops/me/stats :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /shops/me — Modifier infos boutique
// ---------------------------------------------------------------------------
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

    const { name, whatsapp, whatsappOrderNotif, logo } = parsed.data;

    if (name && name !== shop.name) {
      shop.name = name;
      shop.slug = await ShopService.generateUniqueSlug(name);
    }
    if (whatsapp           !== undefined) shop.whatsapp           = whatsapp;
    if (whatsappOrderNotif !== undefined) shop.whatsappOrderNotif = whatsappOrderNotif;
    if (logo               !== undefined) (shop as any).logo      = logo;

    await shop.save();
    res.json({ success: true, data: shop, message: 'Boutique mise à jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /shops/me/theme — Changer le thème
// ---------------------------------------------------------------------------
router.patch('/me/theme', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const { selectedTheme } = req.body;

    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const THEMES_BASIC   = ['vitrine-moderne', 'marche-colore'];
    const THEMES_PREMIUM = [...THEMES_BASIC, 'luxe-sombre', 'boutique-pro', 'stories-style'];
    const themes         = shop.planType === 'premium' ? THEMES_PREMIUM : THEMES_BASIC;

    if (!themes.includes(selectedTheme)) {
      res.status(403).json({ success: false, message: 'Thème non disponible pour votre plan' });
      return;
    }

    shop.selectedTheme = selectedTheme;
    await shop.save();

    res.json({ success: true, data: shop, message: 'Thème mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me/theme :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /shops/me/about — Modifier À propos
// ---------------------------------------------------------------------------
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

    res.json({ success: true, data: shop, message: 'À propos mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me/about :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /shops/me/logo — Upload logo
// ---------------------------------------------------------------------------
router.post('/me/logo', authenticate, requireMerchant, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
      return;
    }

    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      `shopeasy/${shop._id}/logo`,
      [{ width: 400, height: 400, crop: 'fill' }]
    );

    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Erreur upload logo :', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

// ---------------------------------------------------------------------------
// POST /shops/me/owner-photo — Upload photo propriétaire
// ---------------------------------------------------------------------------
router.post('/me/owner-photo', authenticate, requireMerchant, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
      return;
    }

    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      `shopeasy/${shop._id}/owner`,
      [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    );

    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Erreur upload owner-photo :', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

// ---------------------------------------------------------------------------
// GET /shops/:slug — Boutique publique (storefront)
// ⚠️ DOIT être en dernier
// ---------------------------------------------------------------------------
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug })
      .select('-__v')
      .lean();

    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    if (shop.subscriptionStatus === 'expired' || shop.subscriptionStatus === 'suspended') {
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