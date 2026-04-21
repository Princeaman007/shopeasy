import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { Shop } from '../models/Shop';
import { authenticate, requireMerchant } from '../middleware/auth';
import slugify from 'slugify';

const router = Router();

// ---------------------------------------------------------------------------
const categorySchema = z.object({
  name:     z.string().min(2).max(60),
  icon:     z.string().max(10).optional(),
  parentId: z.string().optional().nullable(),
  order:    z.number().optional(),
});

const getShop = (userId: string) => Shop.findOne({ ownerId: userId });

// ---------------------------------------------------------------------------
// GET /categories/shop/me — Catégories du marchand connecté
// ⚠️ DOIT être avant /:id
// ---------------------------------------------------------------------------
router.get('/shop/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const categories = await Category.find({ shopId: shop._id })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Erreur GET /categories/shop/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /categories/shop/:shopId — Catégories publiques d'une boutique (storefront)
// ---------------------------------------------------------------------------
router.get('/shop/:shopId', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ shopId: req.params.shopId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Erreur GET /categories/shop/:shopId :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /categories — Créer une catégorie custom
// ---------------------------------------------------------------------------
router.post('/', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors:  parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const { name, icon, parentId, order } = parsed.data;

    let slug = slugify(name, { lower: true, strict: true, locale: 'fr' });
    const existing = await Category.findOne({ shopId: shop._id, slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const count = await Category.countDocuments({ shopId: shop._id });

    const category = await Category.create({
      shopId:     shop._id,
      name,
      slug,
      icon:       icon     ?? '📦',
      parentId:   parentId ?? null,
      order:      order    ?? count + 1,
      predefined: false,
    });

    res.status(201).json({ success: true, data: category, message: 'Catégorie créée' });
  } catch (error) {
    console.error('Erreur POST /categories :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /categories/:id — Modifier une catégorie
// ---------------------------------------------------------------------------
router.patch('/:id', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors:  parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const category = await Category.findOne({ _id: req.params.id, shopId: shop._id });
    if (!category) {
      res.status(404).json({ success: false, message: 'Catégorie introuvable' });
      return;
    }

    const { name, icon, parentId, order } = parsed.data;

    if (name && name !== category.name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true, locale: 'fr' });
    }
    if (icon     !== undefined) category.icon     = icon;
    if (parentId !== undefined) category.parentId = parentId as any;
    if (order    !== undefined) category.order    = order;

    await category.save();
    res.json({ success: true, data: category, message: 'Catégorie mise à jour' });
  } catch (error) {
    console.error('Erreur PATCH /categories/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /categories/:id — Supprimer une catégorie custom
// ---------------------------------------------------------------------------
router.delete('/:id', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const category = await Category.findOne({ _id: req.params.id, shopId: shop._id });
    if (!category) {
      res.status(404).json({ success: false, message: 'Catégorie introuvable' });
      return;
    }

    if (category.predefined) {
      res.status(403).json({
        success: false,
        message: 'Les catégories prédéfinies ne peuvent pas être supprimées',
      });
      return;
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('Erreur DELETE /categories/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;