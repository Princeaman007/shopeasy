"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
const Shop_1 = require("../models/Shop");
const Category_1 = require("../models/Category");
const slugify_1 = __importDefault(require("slugify"));
/**
 * Catégories prédéfinies créées automatiquement à l'ouverture d'une boutique
 */
const CATEGORIES_PREDEFINIES = [
    { name: 'Mode femme', icon: '👗', order: 1 },
    { name: 'Mode homme', icon: '👔', order: 2 },
    { name: 'Chaussures', icon: '👟', order: 3 },
    { name: 'Accessoires', icon: '👜', order: 4 },
    { name: 'Lunettes', icon: '🕶️', order: 5 },
    { name: 'Beauté & Cosmétiques', icon: '💄', order: 6 },
    { name: 'Enfants', icon: '🧸', order: 7 },
    { name: 'Maison & Déco', icon: '🏠', order: 8 },
    { name: 'Alimentation', icon: '🍎', order: 9 },
    { name: 'Autre', icon: '📦', order: 10 },
];
class ShopService {
    /**
     * Génère un slug unique pour la boutique
     */
    static async generateUniqueSlug(name) {
        let slug = (0, slugify_1.default)(name, { lower: true, strict: true, locale: 'fr' });
        let exists = await Shop_1.Shop.findOne({ slug });
        let count = 1;
        // Ajoute un suffixe numérique si le slug est déjà pris
        while (exists) {
            slug = `${(0, slugify_1.default)(name, { lower: true, strict: true })}${count}`;
            exists = await Shop_1.Shop.findOne({ slug });
            count++;
        }
        return slug;
    }
    /**
     * Crée les catégories prédéfinies pour une nouvelle boutique
     */
    static async createDefaultCategories(shopId) {
        const categories = CATEGORIES_PREDEFINIES.map((cat) => ({
            shopId,
            name: cat.name,
            slug: (0, slugify_1.default)(cat.name, { lower: true, strict: true, locale: 'fr' }),
            parentId: null,
            predefined: true,
            icon: cat.icon,
            order: cat.order,
        }));
        await Category_1.Category.insertMany(categories);
    }
}
exports.ShopService = ShopService;
//# sourceMappingURL=ShopService.js.map