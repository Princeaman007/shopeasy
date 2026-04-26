"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncIndexes = void 0;
const User_1 = require("../models/User");
const Shop_1 = require("../models/Shop");
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const PromoCode_1 = require("../models/PromoCode");
const Analytics_1 = require("../models/Analytics");
const Lead_1 = require("../models/Lead");
/**
 * Synchronise tous les index MongoDB
 * À appeler une seule fois au démarrage de l'API
 * En production, les index sont créés en arrière-plan
 */
const syncIndexes = async () => {
    try {
        await Promise.all([
            // User — index sur email (unique)
            User_1.User.syncIndexes(),
            // Shop — index sur slug (unique)
            Shop_1.Shop.syncIndexes(),
            // Category — index composite shopId+slug (unique)
            Category_1.Category.syncIndexes(),
            // Product — index composite shopId+slug (unique) + shopId+status
            Product_1.Product.syncIndexes(),
            // Order — index sur orderNumber (unique) + shopId+createdAt + customer.email
            Order_1.Order.syncIndexes(),
            // PromoCode — index composite shopId+code (unique)
            PromoCode_1.PromoCode.syncIndexes(),
            // Analytics — index composite shopId+date (unique) + shopId+date desc
            Analytics_1.Analytics.syncIndexes(),
            // Lead — index sur createdAt + status
            Lead_1.Lead.syncIndexes(),
        ]);
        console.log('✅ Index MongoDB synchronisés');
    }
    catch (error) {
        console.error('❌ Erreur synchronisation index :', error);
        throw error;
    }
};
exports.syncIndexes = syncIndexes;
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
//# sourceMappingURL=indexes.js.map