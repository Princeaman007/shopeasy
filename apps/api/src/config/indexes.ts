import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { PromoCode } from '../models/PromoCode';
import { Analytics } from '../models/Analytics';
import { Lead } from '../models/Lead';

/**
 * Synchronise tous les index MongoDB
 * À appeler une seule fois au démarrage de l'API
 * En production, les index sont créés en arrière-plan
 */
export const syncIndexes = async (): Promise<void> => {
  try {
    await Promise.all([
      // User — index sur email (unique)
      User.syncIndexes(),

      // Shop — index sur slug (unique)
      Shop.syncIndexes(),

      // Category — index composite shopId+slug (unique)
      Category.syncIndexes(),

      // Product — index composite shopId+slug (unique) + shopId+status
      Product.syncIndexes(),

      // Order — index sur orderNumber (unique) + shopId+createdAt + customer.email
      Order.syncIndexes(),

      // PromoCode — index composite shopId+code (unique)
      PromoCode.syncIndexes(),

      // Analytics — index composite shopId+date (unique) + shopId+date desc
      Analytics.syncIndexes(),

      // Lead — index sur createdAt + status
      Lead.syncIndexes(),
    ]);

    console.log('✅ Index MongoDB synchronisés');
  } catch (error) {
    console.error('❌ Erreur synchronisation index :', error);
    throw error;
  }
};

/**
 * Récapitulatif des index par modèle (pour documentation)
 *
 * User        : email (unique)
 * Shop        : slug (unique)
 * Category    : shopId+slug (unique)
 * Product     : shopId+slug (unique), shopId+status
 * Order       : orderNumber (unique), shopId+createdAt, customer.email
 * PromoCode   : shopId+code (unique)
 * Analytics   : shopId+date (unique), shopId+date desc
 * Lead        : createdAt desc, status
 */