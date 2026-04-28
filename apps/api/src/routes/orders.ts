import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Order }   from '../models/Order';
import { Product } from '../models/Product';
import { Shop }    from '../models/Shop';
import { User }    from '../models/User';
import { authenticate, requireMerchant, optionalAuth } from '../middleware/auth';
import {
  sendOrderNotificationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} from '../services/Email';

const router = Router();

// ---------------------------------------------------------------------------
// Schémas
// ---------------------------------------------------------------------------
const itemSchema = z.object({
  productId: z.string(),
  name:      z.string().optional(),
  price:     z.number().optional(),
  quantity:  z.number().int().min(1),
  variants:  z.record(z.string()).optional(),
  variant:   z.string().optional(),
  image:     z.string().optional().nullable(),
});

const createOrderSchema = z.object({
  shopId:        z.string(),
  items:         z.array(itemSchema).min(1),
  nomClient:     z.string().min(2).optional(),
  telephone:     z.string().min(8).optional(),
  adresse:       z.string().optional(),
  ville:         z.string().optional(),
  modeLivraison: z.enum(['livraison', 'retrait']).optional(),
  notes:         z.string().optional(),
  subtotal:      z.number().optional(),
  total:         z.number().optional(),
  promoCode:     z.string().optional(),
  discount:      z.number().optional(),
  customer: z.object({
    name:    z.string().min(2).max(100),
    phone:   z.string().min(8).max(20),
    email:   z.string().email().optional(),
    address: z.string().min(5).max(300),
    city:    z.string().min(2).max(100),
  }).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'shipping', 'delivered', 'cancelled']),
  note:   z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const genererNumeroCommande = async (): Promise<string> => {
  const annee  = new Date().getFullYear();
  const count  = await Order.countDocuments();
  const numero = String(count + 1).padStart(4, '0');
  return `SEC-${annee}-${numero}`;
};

const getShop = (userId: string, shopId?: string) =>
  Shop.findOne({ ownerId: userId }).then(shop =>
    shop ? shop : shopId ? Shop.findById(shopId) : null
  );

// ---------------------------------------------------------------------------
// POST /orders — Créer une commande (public, storefront)
// ---------------------------------------------------------------------------
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors:  parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      shopId, items, promoCode,
      nomClient, telephone, adresse, ville, modeLivraison, notes,
      subtotal: subtotalFront, total: totalFront, discount: discountFront,
      customer,
    } = parsed.data;

    const shop = await Shop.findById(shopId);
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

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (item.price && item.name) {
        subtotal += item.price * item.quantity;
        orderItems.push({
          productId: item.productId,
          name:      item.name,
          price:     item.price,
          quantity:  item.quantity,
          variant:   item.variant ?? '',
          variants:  item.variants ?? {},
          image:     item.image ?? '',
        });
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { totalStock: -item.quantity },
        });
        continue;
      }

      const product = await Product.findOne({
        _id: item.productId, shopId, status: 'active',
      });

      if (!product) {
        res.status(400).json({ success: false, message: `Produit introuvable : ${item.productId}` });
        return;
      }

      if (product.totalStock < item.quantity) {
        res.status(400).json({ success: false, message: `Stock insuffisant pour : ${product.name}` });
        return;
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        name:      product.name,
        price:     product.price,
        quantity:  item.quantity,
        variant:   item.variant ?? '',
        variants:  item.variants ?? {},
        image:     product.images[0] ?? '',
      });

      product.totalStock -= item.quantity;
      if (product.totalStock === 0) product.status = 'out_of_stock';
      await product.save();
    }

    let discount      = discountFront ?? 0;
    let promoApplique = '';

    if (promoCode && shop.planType === 'premium' && !discount) {
      const { PromoCode } = await import('../models/PromoCode');
      const promo = await PromoCode.findOne({
        shopId, code: promoCode.toUpperCase(), isActive: true,
      });

      if (promo) {
        const nonExpire  = !promo.expiresAt || promo.expiresAt > new Date();
        const sousLimite = !promo.maxUses   || promo.usedCount < promo.maxUses;
        const montantOk  = !promo.minOrder  || subtotal >= promo.minOrder;

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

    const total = totalFront ?? Math.max(0, subtotal - discount);
    const orderNumber  = await genererNumeroCommande();
    const clientNom    = nomClient ?? customer?.name    ?? '';
    const clientTel    = telephone ?? customer?.phone   ?? '';
    const clientAdr    = adresse   ?? customer?.address ?? '';
    const clientVille  = ville     ?? customer?.city    ?? '';

    const order = await Order.create({
      shopId,
      customerId:    req.user?.userId ?? null,
      orderNumber,
      items:         orderItems,
      promoCode:     promoApplique,
      discount,
      subtotal,
      total,
      nomClient:     clientNom,
      telephone:     clientTel,
      adresse:       clientAdr,
      ville:         clientVille,
      modeLivraison: modeLivraison ?? 'livraison',
      notes:         notes ?? '',
      customer: {
        name:    clientNom,
        phone:   clientTel,
        address: clientAdr,
        city:    clientVille,
        isGuest: !req.user,
      },
      status: 'new',
      statusHistory: [{ status: 'new', date: new Date(), note: 'Commande passée' }],
      smsSent:     false,
      waNotifSent: false,
    });

    // Email au marchand
    try {
      const merchant = await User.findOne({ _id: shop.ownerId }).select('email name');
      if (merchant?.email) {
        await sendOrderNotificationEmail(merchant.email, merchant.name, {
          orderNumber:   order.orderNumber,
          customerName:  clientNom,
          customerPhone: clientTel,
          total:         order.total,
          items:         orderItems.map(i => ({
            name: i.name, quantity: i.quantity, price: i.price,
          })),
        });
      }
    } catch (emailErr) {
      console.error('Erreur email marchand:', emailErr);
    }

    // Email au client si email fourni
    try {
      const customerEmail = customer?.email;
      if (customerEmail) {
        await sendOrderConfirmationEmail(customerEmail, clientNom, {
          orderNumber: order.orderNumber,
          shopName:    shop.name,
          total:       order.total,
          items:       orderItems.map(i => ({
            name: i.name, quantity: i.quantity, price: i.price,
          })),
          address: clientAdr,
          city:    clientVille,
        });
      }
    } catch (emailErr) {
      console.error('Erreur email client:', emailErr);
    }

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

// ---------------------------------------------------------------------------
// GET /orders/mes-commandes
// ---------------------------------------------------------------------------
router.get('/mes-commandes', authenticate, async (req, res) => {
  try {
    const commandes = await Order.find({ customerId: req.user!.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders: commandes });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /orders/shop/me — Commandes du marchand
// ---------------------------------------------------------------------------
router.get('/shop/me', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId, req.user!.shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const { page = '1', limit = '20', status } = req.query;
    const filter: Record<string, any> = { shopId: shop._id };
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

// ---------------------------------------------------------------------------
// GET /orders/shop/me/stats
// ---------------------------------------------------------------------------
router.get('/shop/me/stats', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shop = await getShop(req.user!.userId, req.user!.shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const shopId = shop._id;
    const [total, nouvelles, confirmées, enLivraison, livrées, annulées] =
      await Promise.all([
        Order.countDocuments({ shopId }),
        Order.countDocuments({ shopId, status: 'new' }),
        Order.countDocuments({ shopId, status: 'confirmed' }),
        Order.countDocuments({ shopId, status: 'shipping' }),
        Order.countDocuments({ shopId, status: 'delivered' }),
        Order.countDocuments({ shopId, status: 'cancelled' }),
      ]);

    const ca = await Order.aggregate([
      { $match: { shopId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      success: true,
      data: { total, nouvelles, confirmées, enLivraison, livrées, annulées, chiffreAffaires: ca[0]?.total ?? 0 },
    });
  } catch (error) {
    console.error('Erreur GET /orders/shop/me/stats :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /orders/client/me
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /orders/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      res.status(404).json({ success: false, message: 'Commande introuvable' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Erreur GET /orders/:id :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /orders/:id/status — Mettre à jour le statut (marchand)
// ---------------------------------------------------------------------------
router.patch('/:id/status', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Statut invalide',
        errors:  parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const shop = await getShop(req.user!.userId, req.user!.shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Boutique introuvable' });
      return;
    }

    const order = await Order.findOne({ _id: req.params.id, shopId: shop._id });
    if (!order) {
      res.status(404).json({ success: false, message: 'Commande introuvable' });
      return;
    }

    const { status, note } = parsed.data;

    const transitions: Record<string, string[]> = {
      new:       ['confirmed', 'cancelled'],
      confirmed: ['shipping',  'cancelled'],
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
    order.statusHistory.push({ status, date: new Date(), note: note ?? '' });
    await order.save();

    // Email au client si email fourni
    try {
      const customerEmail = order.customer?.email;
      const customerName  = order.nomClient ?? order.customer?.name ?? '';
      if (customerEmail) {
        await sendOrderStatusEmail(customerEmail, customerName, {
          orderNumber: order.orderNumber,
          shopName:    shop.name,
          status,
          total:       order.total,
        });
      }
    } catch (emailErr) {
      console.error('Erreur email statut:', emailErr);
    }

    res.json({ success: true, data: order, message: `Commande ${status}` });
  } catch (error) {
    console.error('Erreur PATCH /orders/:id/status :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;