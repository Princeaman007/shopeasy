import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Shop } from '../models/Shop';
import { authenticate, requireMerchant, optionalAuth } from '../middleware/auth';

const router = Router();

// ─── Schémas de validation ───────────────────────────────────────────────────

const itemSchema = z.object({
  productId: z.string(),
  quantity:  z.number().int().min(1),
  variant:   z.string().optional(),
});

const customerSchema = z.object({
  name:    z.string().min(2).max(100),
  phone:   z.string().min(8).max(20),
  email:   z.string().email().optional(),
  address: z.string().min(5).max(300),
  city:    z.string().min(2).max(100),
});

const createOrderSchema = z.object({
  shopId:    z.string(),
  items:     z.array(itemSchema).min(1),
  customer:  customerSchema,
  promoCode: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'shipping', 'delivered', 'cancelled']),
  note:   z.string().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Génère un numéro de commande unique — ex: SEC-2024-0042
 */
const genererNumeroCommande = async (): Promise<string> => {
  const annee = new Date().getFullYear();
  const count = await Order.countDocuments();
  const numero = String(count + 1).padStart(4, '0');
  return `SEC-${annee}-${numero}`;
};

// ─── POST /orders — Créer une commande (client ou invité) ────────────────────

router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { shopId, items, customer, promoCode } = parsed.data;

    // Vérifie que la boutique existe et est active
    const shop = await Shop.findById(shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

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

    // Récupère les produits et calcule les prix
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findOne({
        _id:    item.productId,
        shopId,
        status: 'active',
      });

      if (!product) {
        res.status(400).json({
          success: false,
          message: `Produit introuvable ou indisponible : ${item.productId}`,
        });
        return;
      }

      // Vérifie le stock
      if (product.totalStock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Stock insuffisant pour : ${product.name}`,
        });
        return;
      }

      const prix = product.price;
      subtotal += prix * item.quantity;

      orderItems.push({
        productId: product._id,
        name:      product.name,
        price:     prix,
        quantity:  item.quantity,
        variant:   item.variant ?? '',
        image:     product.images[0] ?? '',
      });

      // Décrémente le stock
      product.totalStock -= item.quantity;
      if (product.totalStock === 0) product.status = 'out_of_stock';
      await product.save();
    }

    // Applique le code promo si fourni (premium uniquement)
    let discount = 0;
    let promoApplique = '';

    if (promoCode && shop.planType === 'premium') {
      const { PromoCode } = await import('../models/PromoCode');
      const promo = await PromoCode.findOne({
        shopId,
        code:     promoCode.toUpperCase(),
        isActive: true,
      });

      if (promo) {
        const now = new Date();
        const nonExpire  = !promo.expiresAt || promo.expiresAt > now;
        const sousLimite = !promo.maxUses || promo.usedCount < promo.maxUses;
        const montantOk  = !promo.minOrder || subtotal >= promo.minOrder;

        if (nonExpire && sousLimite && montantOk) {
          discount = promo.type === 'percent'
            ? Math.round(subtotal * promo.value / 100)
            : promo.value;

          promo.usedCount += 1;
          await promo.save();
          promoApplique = promo.code;
        }
      }
    }

    const total          = Math.max(0, subtotal - discount);
    const orderNumber    = await genererNumeroCommande();
    const isGuest        = !req.user;
    const customerId     = req.user ? req.user.userId : undefined;

    const order = await Order.create({
      shopId,
      customerId:  customerId ?? null,
      orderNumber,
      items:       orderItems,
      promoCode:   promoApplique,
      discount,
      subtotal,
      total,
      customer: {
        ...customer,
        isGuest,
      },
      status: 'new',
      statusHistory: [{
        status: 'new',
        date:   new Date(),
        note:   'Commande passée',
      }],
      smsSent:     false,
      waNotifSent: false,
    });

    res.status(201).json({
      success: true,
      data:    order,
      message: 'Commande créée avec succès',
    });
  } catch (error) {
    console.error('Erreur POST /orders :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /orders/shop/me — Commandes du marchand ─────────────────────────────

router.get('/shop/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const {
      page   = '1',
      limit  = '20',
      status,
    } = req.query;

    const filter: Record<string, any> = { shopId: req.shop!.id };
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /orders/shop/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /orders/shop/me/stats — Stats commandes du marchand ─────────────────

router.get('/shop/me/stats', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shopId = req.shop!.id;

    const [total, nouvelles, confirmées, enLivraison, livrées, annulées] =
      await Promise.all([
        Order.countDocuments({ shopId }),
        Order.countDocuments({ shopId, status: 'new' }),
        Order.countDocuments({ shopId, status: 'confirmed' }),
        Order.countDocuments({ shopId, status: 'shipping' }),
        Order.countDocuments({ shopId, status: 'delivered' }),
        Order.countDocuments({ shopId, status: 'cancelled' }),
      ]);

    // Chiffre d'affaires total (commandes livrées)
    const ca = await Order.aggregate([
      { $match: { shopId: shopId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        nouvelles,
        confirmées,
        enLivraison,
        livrées,
        annulées,
        chiffreAffaires: ca[0]?.total ?? 0,
      },
    });
  } catch (error) {
    console.error('Erreur GET /orders/shop/me/stats :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /orders/:id — Détail d'une commande ─────────────────────────────────

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      res.status(404).json({ success: false, message: 'Commande introuvable' });
      return;
    }

    // Un marchand ne peut voir que ses commandes
    if (
      req.user!.role === 'merchant' &&
      String(order.shopId) !== req.shop?.id
    ) {
      res.status(403).json({ success: false, message: 'Accès refusé' });
      return;
    }

    // Un client ne peut voir que ses propres commandes
    if (
      req.user!.role === 'client' &&
      String(order.customerId) !== req.user!.userId
    ) {
      res.status(403).json({ success: false, message: 'Accès refusé' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Erreur GET /orders/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── PATCH /orders/:id/status — Mettre à jour le statut (marchand) ───────────

router.patch('/:id/status', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Statut invalide',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const order = await Order.findOne({
      _id:    req.params.id,
      shopId: req.shop!.id,
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Commande introuvable' });
      return;
    }

    const { status, note } = parsed.data;

    // Transitions de statut autorisées
    const transitions: Record<string, string[]> = {
      new:       ['confirmed', 'cancelled'],
      confirmed: ['shipping', 'cancelled'],
      shipping:  ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };

    if (!transitions[order.status]?.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Transition invalide : ${order.status} → ${status}`,
      });
      return;
    }

    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: note ?? '',
    });

    await order.save();

    res.json({
      success: true,
      data:    order,
      message: `Commande ${status}`,
    });
  } catch (error) {
    console.error('Erreur PATCH /orders/:id/status :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /orders/client/me — Commandes du client connecté ────────────────────

router.get('/client/me', authenticate, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ customerId: req.user!.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Erreur GET /orders/client/me :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;