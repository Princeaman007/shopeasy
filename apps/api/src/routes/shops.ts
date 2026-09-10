import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Shop }     from '../models/Shop';
import { Product }  from '../models/Product';
import { Category } from '../models/Category';
import { authenticate, requireMerchant } from '../middleware/auth';
import { ShopService } from '../services/ShopService';
import { Order } from '../models/Order';

// ─── Multer ───────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },
});

const uploadHero = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
});

// ─── Cloudinary ───────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// ─── Schemas Zod ──────────────────────────────────────────────────────────────

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
  returnPolicy: z.string().max(500).optional(),
});

// ─── Helper Cloudinary ────────────────────────────────────────────────────────

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

// ─── Helper — trouve la boutique du marchand ou de l'équipier ─────────────────

const getMyShop = async (userId: string, shopId?: string) => {
  // Propriétaire
  let shop = await Shop.findOne({ ownerId: userId });
  // Équipier — utilise le shopId du token JWT
  if (!shop && shopId) {
    shop = await Shop.findById(shopId);
  }
  return shop;
};

// ─── GET /shops/me ────────────────────────────────────────────────────────────

router.get('/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error('Erreur GET /shops/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /shops/me/stats ──────────────────────────────────────────────────────

router.get('/me/stats', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

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

// ─── GET /shops/me/equipe ─────────────────────────────────────────────────────

router.get('/me/equipe', authenticate, requireMerchant, async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }
    await shop.populate('admins', 'name email');
    res.json({ success: true, membres: shop.admins });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── POST /shops/me/equipe ────────────────────────────────────────────────────

router.post('/me/equipe', authenticate, requireMerchant, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ success: false, message: 'Email obligatoire' }); return; }

    const { User } = await import('../models/User');
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) { res.status(404).json({ success: false, message: 'Aucun compte trouve avec cet email' }); return; }

    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

    if (shop.planType !== 'premium') {
      res.status(403).json({ success: false, message: 'Fonctionnalite Premium uniquement' }); return;
    }
    if (String(userToAdd._id) === req.user!.userId) {
      res.status(400).json({ success: false, message: 'Vous etes deja proprietaire' }); return;
    }

    const dejaAdmin = shop.admins.some((a: any) => String(a) === String(userToAdd._id));
    if (dejaAdmin) {
      res.status(400).json({ success: false, message: "Cet utilisateur est deja dans l'equipe" }); return;
    }

    shop.admins.push(userToAdd._id as any);
    await shop.save();

    // ✅ Change le rôle de l'équipier en merchant et assigne le shopId
    await User.findByIdAndUpdate(userToAdd._id, {
      role:   'merchant',
      shopId: shop._id,
    });

    await shop.populate('admins', 'name email');
    res.json({ success: true, membres: shop.admins });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── DELETE /shops/me/equipe/:userId ─────────────────────────────────────────

router.delete('/me/equipe/:userId', authenticate, requireMerchant, async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }
    shop.admins = shop.admins.filter((a: any) => String(a) !== req.params.userId) as any;
    await shop.save();
    await shop.populate('admins', 'name email');
    res.json({ success: true, membres: shop.admins });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── PATCH /shops/me ─────────────────────────────────────────────────────────

router.patch('/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = updateShopSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Donnees invalides', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

    const { name, whatsapp, whatsappOrderNotif, logo } = parsed.data;

    if (name && name !== shop.name) {
      shop.name = name;
      shop.slug = await ShopService.generateUniqueSlug(name);
    }
    if (whatsapp           !== undefined) shop.whatsapp           = whatsapp;
    if (whatsappOrderNotif !== undefined) shop.whatsappOrderNotif = whatsappOrderNotif;
    if (logo               !== undefined) (shop as any).logo      = logo;

    await shop.save();
    res.json({ success: true, data: shop, message: 'Boutique mise a jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── PATCH /shops/me/theme ────────────────────────────────────────────────────

router.patch('/me/theme', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const { selectedTheme } = req.body;
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

    const THEMES_BASIC   = ['vitrine-moderne', 'marche-colore'];
    const THEMES_PREMIUM = [...THEMES_BASIC, 'luxe-sombre', 'boutique-pro', 'stories-style'];
    const themes         = shop.planType === 'premium' ? THEMES_PREMIUM : THEMES_BASIC;

    if (!themes.includes(selectedTheme)) {
      res.status(403).json({ success: false, message: 'Theme non disponible pour votre plan' }); return;
    }

    shop.selectedTheme = selectedTheme;
    await shop.save();
    res.json({ success: true, data: shop, message: 'Theme mis a jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me/theme :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── PATCH /shops/me/about ────────────────────────────────────────────────────

router.patch('/me/about', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = updateAboutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Donnees invalides', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

    (shop as any).about = parsed.data;
    await shop.save();

    res.json({ success: true, data: shop, message: 'A propos mis a jour' });
  } catch (error) {
    console.error('Erreur PATCH /shops/me/about :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /shops/me/logo ──────────────────────────────────────────────────────

router.post('/me/logo', authenticate, requireMerchant, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'Aucun fichier recu' }); return; }
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }
    const result = await uploadToCloudinary(req.file.buffer, `shopeasy/${shop._id}/logo`,
      [{ width: 400, height: 400, crop: 'fill' }]);
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Erreur upload logo :', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

// ─── POST /shops/me/owner-photo ───────────────────────────────────────────────

router.post('/me/owner-photo', authenticate, requireMerchant, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'Aucun fichier recu' }); return; }
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }
    const result = await uploadToCloudinary(req.file.buffer, `shopeasy/${shop._id}/owner`,
      [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]);
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Erreur upload owner-photo :', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

// ─── POST /shops/me/hero ──────────────────────────────────────────────────────

router.post('/me/hero', authenticate, requireMerchant, (req, res, next) => {
  uploadHero.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'Fichier trop volumineux — max 10 Mo' });
    }
    if (err) return res.status(500).json({ success: false, message: 'Erreur upload' });
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'Aucun fichier recu' }); return; }
    const shop = await getMyShop(req.user!.userId, req.user!.shopId);
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }
    const result = await uploadToCloudinary(req.file.buffer, `shopeasy/${shop._id}/hero`,
      [{ width: 1920, height: 600, crop: 'fill', gravity: 'auto' }]);
    shop.heroImage = result.secure_url;
    await shop.save();
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Erreur upload hero :', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

// ─── GET /shops/annuaire ──────────────────────────────────────────────────────

router.get('/annuaire', async (req: Request, res: Response): Promise<void> => {
  try {
    const page      = parseInt(req.query.page as string) || 1;
    const limite    = 12;
    const recherche = req.query.q as string || '';
    const skip      = (page - 1) * limite;

    const filtre: Record<string, unknown> = {
      planType:           'premium',
      subscriptionStatus: { $in: ['active', 'trial'] },
    };

    if (recherche.trim()) {
      filtre.name = { $regex: recherche.trim(), $options: 'i' };
    }

    const [boutiques, total] = await Promise.all([
      Shop.find(filtre)
        .select('slug name about isVerified selectedTheme createdAt heroImage logo')
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      Shop.countDocuments(filtre),
    ]);

    const boutiquesAvecProduits = await Promise.all(
      boutiques.map(async (shop: any) => {
        const produits = await Product.find({ shopId: shop._id, status: 'active' })
          .select('name price images')
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();
        return { ...shop, produits };
      })
    );

    res.json({
      boutiques: boutiquesAvecProduits,
      pagination: {
        page,
        total,
        pages:   Math.ceil(total / limite),
        parPage: limite,
      },
    });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── GET /shops/recherche-globale — Recherche boutiques + produits ────────────
router.get('/recherche-globale', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      res.json({ boutiques: [], produits: [] });
      return;
    }

    const regex = { $regex: q, $options: 'i' };

    // ── Recherche boutiques par nom ──────────────────────────────────────────
    const boutiquesTrouvees = await Shop.find({
      planType: 'premium',
      subscriptionStatus: { $in: ['active', 'trial'] },
      name: regex,
    })
      .select('slug name about isVerified selectedTheme heroImage logo')
      .limit(6)
      .lean();

    // ── Recherche produits par nom, dans les boutiques premium actives ───────
    const shopsActifs = await Shop.find({
      planType: 'premium',
      subscriptionStatus: { $in: ['active', 'trial'] },
    }).select('_id').lean();

    const produitsTrouves = await Product.find({
      shopId: { $in: shopsActifs.map((s) => s._id) },
      status: 'active',
      name: regex,
    })
      .select('name price images shopId')
      .limit(12)
      .lean();

    // ── Attache le nom + slug de la boutique a chaque produit ────────────────
    const shopsMap = new Map(
      (await Shop.find({ _id: { $in: produitsTrouves.map((p) => p.shopId) } })
        .select('slug name')
        .lean()
      ).map((s) => [String(s._id), s])
    );

    const produitsAvecBoutique = produitsTrouves.map((p) => ({
      ...p,
      boutique: shopsMap.get(String(p.shopId)) || null,
    }));

    res.json({
      boutiques: boutiquesTrouvees,
      produits: produitsAvecBoutique,
    });
  } catch (error) {
    console.error('Erreur GET /shops/recherche-globale :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ─── A ajouter en haut de shops.ts, avec les autres imports ───────────────────
// import { Order } from '../models/Order';

// ─── GET /shops/vitrine — Flux de produits multi-boutiques pour la page /boutiques ──
router.get('/vitrine', async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    const limite = 20;
    const categorie = typeof req.query.categorie === 'string' ? req.query.categorie : '';
    const skip  = (page - 1) * limite;

    const shopsActifs = await Shop.find({
      planType: 'premium',
      subscriptionStatus: { $in: ['active', 'trial'] },
    }).select('_id slug name isVerified').lean();

    const shopsMap = new Map(shopsActifs.map((s) => [String(s._id), s]));
    const shopIds  = shopsActifs.map((s) => s._id);

    const filtre: any = {
      shopId: { $in: shopIds },
      status: 'active',
    };
    if (categorie.trim()) {
      filtre.categorySlug = categorie.trim();
    }

    const [produits, total] = await Promise.all([
      Product.find(filtre)
        .select('name price comparePrice images shopId categoryId createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      Product.countDocuments(filtre),
    ]);

    const produitsAvecBoutique = produits.map((p) => ({
      ...p,
      boutique: shopsMap.get(String(p.shopId)) || null,
    }));

    res.json({
      produits: produitsAvecBoutique,
      pagination: {
        page,
        total,
        pages: Math.ceil(total / limite),
        parPage: limite,
      },
    });
  } catch (error) {
    console.error('Erreur GET /shops/vitrine :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── GET /shops/populaires — Boutiques les plus actives (par nombre de commandes) ──
router.get('/populaires', async (req: Request, res: Response): Promise<void> => {
  try {
    const limite = parseInt(req.query.limite as string) || 8;

    const shopsActifs = await Shop.find({
      planType: 'premium',
      subscriptionStatus: { $in: ['active', 'trial'] },
    }).select('_id slug name isVerified logo').lean();

    const shopIds = shopsActifs.map((s) => s._id);

    const commandesParBoutique = await Order.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      { $group: { _id: '$shopId', totalCommandes: { $sum: 1 } } },
      { $sort: { totalCommandes: -1 } },
      { $limit: limite },
    ]);

    const compteMap = new Map<string, number>(
      commandesParBoutique.map((c) => [String(c._id), c.totalCommandes])
    );

    const boutiquesPopulaires = shopsActifs
      .filter((s) => compteMap.has(String(s._id)))
      .map((s) => ({
        ...s,
        // Valeur par defaut a 0 pour eviter number | undefined
        totalCommandes: compteMap.get(String(s._id)) ?? 0,
      }))
      .sort((a, b) => b.totalCommandes - a.totalCommandes)
      .slice(0, limite);

    res.json({ boutiques: boutiquesPopulaires });
  } catch (error) {
    console.error('Erreur GET /shops/populaires :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ─── GET /shops/:slug — DOIT etre en dernier ──────────────────────────────────

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug }).select('-__v').lean();
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

    if (shop.subscriptionStatus === 'expired' || shop.subscriptionStatus === 'suspended') {
      res.status(403).json({ success: false, message: 'Cette boutique est temporairement indisponible' });
      return;
    }

    res.json({ success: true, data: shop });
  } catch (error) {
    console.error('Erreur GET /shops/:slug :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;