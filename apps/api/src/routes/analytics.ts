import { Router, Request, Response } from 'express';
import { Analytics } from '../models/Analytics';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { authenticate, requireMerchant } from '../middleware/auth';

const router = Router();

// ─── Middleware Premium ───────────────────────────────────────────────────────

const requirePremium = (req: Request, res: Response, next: Function) => {
  if (req.shop!.planType !== 'premium') {
    res.status(403).json({
      success: false,
      message: 'Les analytics avancés sont réservés au plan Premium',
      code: 'PREMIUM_REQUIRED',
    });
    return;
  }
  next();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formate une date en string YYYY-MM-DD
 */
const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

/**
 * Retourne les 30 derniers jours sous forme de tableau de strings
 */
const derniers30Jours = (): string[] => {
  const jours: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    jours.push(formatDate(d));
  }
  return jours;
};

// ─── GET /analytics/basic — Stats basiques (tous plans) ──────────────────────

router.get('/basic', authenticate, requireMerchant, async (req: Request, res: Response) => {
  try {
    const shopId = req.shop!.id;

    // Période : 30 derniers jours
    const debut = new Date();
    debut.setDate(debut.getDate() - 30);

    // Commandes des 30 derniers jours
    const [
      commandesTotal,
      commandesMois,
      commandesLivrees,
      produitsActifs,
    ] = await Promise.all([
      Order.countDocuments({ shopId }),
      Order.countDocuments({ shopId, createdAt: { $gte: debut } }),
      Order.countDocuments({ shopId, status: 'delivered' }),
      Product.countDocuments({ shopId, status: 'active' }),
    ]);

    // Chiffre d'affaires
    const caTotal = await Order.aggregate([
      { $match: { shopId: shopId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const caMois = await Order.aggregate([
      {
        $match: {
          shopId:    shopId,
          status:    'delivered',
          createdAt: { $gte: debut },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Commandes par statut
    const parStatut = await Order.aggregate([
      { $match: { shopId: shopId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statutMap = parStatut.reduce(
      (acc: Record<string, number>, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    // Évolution commandes sur 30 jours (regroupé par jour)
    const evolutionCommandes = await Order.aggregate([
      {
        $match: {
          shopId:    shopId,
          createdAt: { $gte: debut },
        },
      },
      {
        $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          commandes: { $sum: 1 },
          revenue:   { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Remplit les jours sans commandes avec 0
    const joursMap = evolutionCommandes.reduce(
      (acc: Record<string, any>, item) => {
        acc[item._id] = item;
        return acc;
      },
      {}
    );

    const evolution = derniers30Jours().map((jour) => ({
      date:      jour,
      commandes: joursMap[jour]?.commandes ?? 0,
      revenue:   joursMap[jour]?.revenue   ?? 0,
    }));

    res.json({
      success: true,
      data: {
        resume: {
          commandesTotal,
          commandesMois,
          commandesLivrees,
          produitsActifs,
          chiffreAffairesTotal: caTotal[0]?.total  ?? 0,
          chiffreAffairesMois:  caMois[0]?.total   ?? 0,
        },
        parStatut: statutMap,
        evolution,
      },
    });
  } catch (error) {
    console.error('Erreur GET /analytics/basic :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /analytics/advanced — Analytics avancés (Premium) ───────────────────

router.get(
  '/advanced',
  authenticate,
  requireMerchant,
  requirePremium,
  async (req: Request, res: Response) => {
    try {
      const shopId = req.shop!.id;
      const { periode = '30' } = req.query;
      const jours = Math.min(Number(periode), 90); // max 90 jours

      const debut = new Date();
      debut.setDate(debut.getDate() - jours);

      // Récupère les analytics pré-agrégés
      const analytics = await Analytics.find({
        shopId,
        date: { $gte: formatDate(debut) },
      })
        .sort({ date: 1 })
        .lean();

      // Top produits sur la période
      const topProduits = await Order.aggregate([
        {
          $match: {
            shopId:    shopId,
            createdAt: { $gte: debut },
            status:    { $ne: 'cancelled' },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id:      '$items.productId',
            name:     { $first: '$items.name' },
            commandes: { $sum: '$items.quantity' },
            revenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { commandes: -1 } },
        { $limit: 10 },
      ]);

      // Villes les plus actives
      const topVilles = await Order.aggregate([
        {
          $match: {
            shopId:    shopId,
            createdAt: { $gte: debut },
          },
        },
        {
          $group: {
            _id:   '$customer.city',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // Taux de conversion moyen
      const totalVisiteurs = analytics.reduce((s, a) => s + a.visitors, 0);
      const totalCommandes = analytics.reduce((s, a) => s + a.orders,   0);
      const tauxConversion = totalVisiteurs > 0
        ? ((totalCommandes / totalVisiteurs) * 100).toFixed(2)
        : '0';

      // Revenus par jour (avec jours vides à 0)
      const analyticsMap = analytics.reduce(
        (acc: Record<string, any>, item) => {
          acc[item.date] = item;
          return acc;
        },
        {}
      );

      const joursListe: string[] = [];
      for (let i = jours - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        joursListe.push(formatDate(d));
      }

      const evolution = joursListe.map((jour) => ({
        date:      jour,
        visiteurs: analyticsMap[jour]?.visitors   ?? 0,
        commandes: analyticsMap[jour]?.orders     ?? 0,
        revenue:   analyticsMap[jour]?.revenue    ?? 0,
        conversion: analyticsMap[jour]?.conversion ?? 0,
      }));

      res.json({
        success: true,
        data: {
          periode:        jours,
          totalVisiteurs,
          totalCommandes,
          tauxConversion: `${tauxConversion}%`,
          evolution,
          topProduits,
          topVilles,
        },
      });
    } catch (error) {
      console.error('Erreur GET /analytics/advanced :', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// ─── POST /analytics/track — Enregistre une visite (appelé par le storefront) ─

router.post('/track', async (req: Request, res: Response) => {
  try {
    const { shopId, source = 'direct' } = req.body;

    if (!shopId) {
      res.status(400).json({ success: false, message: 'shopId obligatoire' });
      return;
    }

    const aujourd_hui = formatDate(new Date());

    const sources = ['instagram', 'tiktok', 'facebook', 'direct', 'other'];
    const sourceValide = sources.includes(source) ? source : 'other';

    // Upsert — crée ou incrémente le compteur du jour
    await Analytics.findOneAndUpdate(
      { shopId, date: aujourd_hui },
      {
        $inc: {
          visitors:                    1,
          [`sources.${sourceValide}`]: 1,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur POST /analytics/track :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /analytics/me?periode=7j|30j
router.get('/me', authenticate, requireMerchant, async (req, res) => {
  try {
    const shop    = await Shop.findOne({ ownerId: req.user!.userId });
    if (!shop) { res.status(404).json({ success: false, message: 'Boutique introuvable' }); return; }

    const periode = req.query.periode === '30j' ? 30 : 7;
    const depuis  = new Date();
    depuis.setDate(depuis.getDate() - periode);
    const depuisStr = depuis.toISOString().split('T')[0];

    const data = await Analytics.find({
      shopId: shop._id,
      date:   { $gte: depuisStr },
    }).sort({ date: 1 }).lean();

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;