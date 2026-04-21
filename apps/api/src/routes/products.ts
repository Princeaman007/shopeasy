import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { Shop }    from '../models/Shop';
import { Category } from '../models/Category';
import { authenticate, requireMerchant } from '../middleware/auth';
import slugify from 'slugify';
import { generateShareImage } from '../services/ShareImage';

const router = Router();

// ---------------------------------------------------------------------------
// Schémas
// ---------------------------------------------------------------------------
const variantSchema = z.object({
  type:    z.string(),
  label:   z.string(),
  options: z.array(z.string()),
});

const stockSchema = z.object({
  sku:      z.string(),
  quantity: z.number().int().min(0),
  price:    z.number().optional(),
});

const productSchema = z.object({
  name:         z.string().min(2).max(200),
  description:  z.string().max(2000).optional(),
  categoryId:   z.string().optional(),
  price:        z.number().min(0),
  comparePrice: z.number().optional(),
  images:       z.array(z.string()).optional(),
  video:        z.string().optional(),
  hasVariants:  z.boolean().optional(),
  variants:     z.array(variantSchema).optional(),
  stock:        z.array(stockSchema).optional(),
  totalStock:   z.number().int().min(0).optional(),
  status:       z.enum(['active', 'draft', 'out_of_stock']).optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const calculerStockTotal = (stock: { quantity: number }[]): number =>
  stock.reduce((sum, s) => sum + s.quantity, 0);

const verifierLimitesPlan = (
  planType: 'basic' | 'premium',
  images: string[],
  video?: string
): string | null => {
  if (planType === 'basic') {
    if (images.length > 5) return 'Plan Basic : maximum 5 photos par produit';
    if (video)             return 'Plan Basic : les vidéos ne sont pas disponibles';
  }
  return null;
};

const getShop = (userId: string) => Shop.findOne({ ownerId: userId });

// ---------------------------------------------------------------------------
// GET /products/shop/me — Produits du marchand connecté
// ⚠️ DOIT être avant /shop/:shopId et /:id
// ---------------------------------------------------------------------------
router.get('/shop/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const { page = '1', limit = '20', status, categoryId } = req.query;

    const filter: Record<string, any> = { shopId: shop._id };
    if (status)     filter.status     = status;
    if (categoryId) filter.categoryId = categoryId;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /products/shop/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /products/shop/:shopId — Produits publics d'une boutique (storefront)
// ---------------------------------------------------------------------------
router.get('/shop/:shopId', async (req: Request, res: Response) => {
  try {
    const { categoryId, page = '1', limit = '20' } = req.query;

    const filter: Record<string, any> = {
      shopId: req.params.shopId,
      status: 'active',
    };
    if (categoryId) filter.categoryId = categoryId;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /products/shop/:shopId :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /products/:id — Détail produit public
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit introuvable' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Erreur GET /products/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /products — Créer un produit
// ---------------------------------------------------------------------------
router.post('/', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = productSchema.safeParse(req.body);
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

    if (shop.planType === 'basic') {
      const count = await Product.countDocuments({ shopId: shop._id });
      if (count >= 10) {
        res.status(403).json({
          success: false,
          message: 'Plan Basic : maximum 10 produits. Passez en Premium pour des produits illimités.',
          code:    'PRODUCT_LIMIT_REACHED',
        });
        return;
      }
    }

    const {
      name, description, categoryId, price, comparePrice,
      images = [], video, hasVariants = false, variants = [],
      stock = [], totalStock, status = 'draft',
    } = parsed.data;

    const erreurPlan = verifierLimitesPlan(shop.planType, images, video);
    if (erreurPlan) {
      res.status(403).json({ success: false, message: erreurPlan });
      return;
    }

    if (categoryId) {
      const cat = await Category.findOne({ _id: categoryId, shopId: shop._id });
      if (!cat) {
        res.status(400).json({ success: false, message: 'Catégorie invalide' });
        return;
      }
    }

    let slug = slugify(name, { lower: true, strict: true, locale: 'fr' });
    const existing = await Product.findOne({ shopId: shop._id, slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const stockTotal = hasVariants
      ? calculerStockTotal(stock)
      : (totalStock ?? 0);

    const product = await Product.create({
      shopId:       shop._id,
      categoryId:   categoryId ?? null,
      name,
      description:  description ?? '',
      slug,
      price,
      comparePrice: comparePrice ?? null,
      images,
      video:        video ?? null,
      hasVariants,
      variants,
      stock,
      totalStock:   stockTotal,
      status,
    });

    res.status(201).json({ success: true, data: product, message: 'Produit créé' });
  } catch (error) {
    console.error('Erreur POST /products :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /products/:id — Modifier un produit
// ---------------------------------------------------------------------------
router.patch('/:id', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = productSchema.partial().safeParse(req.body);
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

    const product = await Product.findOne({ _id: req.params.id, shopId: shop._id });
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit introuvable' });
      return;
    }

    const {
      name, description, categoryId, price, comparePrice,
      images, video, hasVariants, variants, stock, totalStock, status,
    } = parsed.data;

    if (images || video) {
      const erreurPlan = verifierLimitesPlan(
        shop.planType,
        images ?? product.images,
        video  ?? (product.video ?? undefined)
      );
      if (erreurPlan) {
        res.status(403).json({ success: false, message: erreurPlan });
        return;
      }
    }

    if (name && name !== product.name) {
      product.name = name;
      let newSlug  = slugify(name, { lower: true, strict: true, locale: 'fr' });
      const exists = await Product.findOne({
        shopId: shop._id, slug: newSlug, _id: { $ne: product._id },
      });
      if (exists) newSlug = `${newSlug}-${Date.now()}`;
      product.slug = newSlug;
    }

    if (description  !== undefined) product.description  = description;
    if (categoryId   !== undefined) product.categoryId   = categoryId as any;
    if (price        !== undefined) product.price        = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (images       !== undefined) product.images       = images;
    if (video        !== undefined) product.video        = video;
    if (hasVariants  !== undefined) product.hasVariants  = hasVariants;
    if (variants     !== undefined) product.variants     = variants as any;
    if (status       !== undefined) product.status       = status;

    if (stock !== undefined) {
      product.stock      = stock as any;
      product.totalStock = product.hasVariants
        ? calculerStockTotal(stock)
        : (totalStock ?? product.totalStock);
    } else if (totalStock !== undefined) {
      product.totalStock = totalStock;
    }

    await product.save();
    res.json({ success: true, data: product, message: 'Produit mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH /products/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /products/:id — Supprimer un produit
// ---------------------------------------------------------------------------
router.delete('/:id', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const product = await Product.findOneAndDelete({ _id: req.params.id, shopId: shop._id });
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit introuvable' });
      return;
    }

    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /products/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /products/:id/stock — Mise à jour rapide du stock
// ---------------------------------------------------------------------------
router.patch('/:id/stock', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const product = await Product.findOne({ _id: req.params.id, shopId: shop._id });
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit introuvable' });
      return;
    }

    const { stock, totalStock } = req.body;

    if (stock !== undefined) {
      product.stock      = stock;
      product.totalStock = calculerStockTotal(stock);
    } else if (totalStock !== undefined) {
      product.totalStock = totalStock;
    }

    if (product.totalStock === 0) {
      product.status = 'out_of_stock';
    } else if (product.status === 'out_of_stock') {
      product.status = 'active';
    }

    await product.save();
    res.json({ success: true, data: product, message: 'Stock mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH /products/:id/stock :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /products/:id/share-image — Génère l'image partageable
// ---------------------------------------------------------------------------
router.post('/:id/share-image', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const product = await Product.findOne({ _id: req.params.id, shopId: shop._id });
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit introuvable' });
      return;
    }

    if (!product.images || product.images.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Le produit doit avoir au moins une image',
      });
      return;
    }

    const shareImageUrl = await generateShareImage({
      productName:  product.name,
      price:        product.price,
      shopName:     shop.name,
      productImage: product.images[0],
      isVerified:   shop.isVerified,
    });

    (product as any).shareImageUrl = shareImageUrl;
    await product.save();

    res.json({ success: true, data: { shareImageUrl }, message: 'Image partageable générée' });
  } catch (error) {
    console.error('Erreur POST /products/:id/share-image :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;