import { Shop } from '../models/Shop';
import { Category } from '../models/Category';
import slugify from 'slugify';

/**
 * Catégories prédéfinies créées automatiquement à l'ouverture d'une boutique
 */
const CATEGORIES_PREDEFINIES = [
  { name: 'Mode femme',        icon: '👗', order: 1 },
  { name: 'Mode homme',        icon: '👔', order: 2 },
  { name: 'Chaussures',        icon: '👟', order: 3 },
  { name: 'Accessoires',       icon: '👜', order: 4 },
  { name: 'Lunettes',          icon: '🕶️', order: 5 },
  { name: 'Beauté & Cosmétiques', icon: '💄', order: 6 },
  { name: 'Enfants',           icon: '🧸', order: 7 },
  { name: 'Maison & Déco',     icon: '🏠', order: 8 },
  { name: 'Alimentation',      icon: '🍎', order: 9 },
  { name: 'Autre',             icon: '📦', order: 10 },
];

export class ShopService {
  /**
   * Génère un slug unique pour la boutique
   */
  static async generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name, { lower: true, strict: true, locale: 'fr' });
    let exists = await Shop.findOne({ slug });
    let count = 1;

    // Ajoute un suffixe numérique si le slug est déjà pris
    while (exists) {
      slug = `${slugify(name, { lower: true, strict: true })}${count}`;
      exists = await Shop.findOne({ slug });
      count++;
    }

    return slug;
  }

  /**
   * Crée les catégories prédéfinies pour une nouvelle boutique
   */
  static async createDefaultCategories(shopId: string): Promise<void> {
    const categories = CATEGORIES_PREDEFINIES.map((cat) => ({
      shopId,
      name: cat.name,
      slug: slugify(cat.name, { lower: true, strict: true, locale: 'fr' }),
      parentId: null,
      predefined: true,
      icon: cat.icon,
      order: cat.order,
    }));

    await Category.insertMany(categories);
  }
}