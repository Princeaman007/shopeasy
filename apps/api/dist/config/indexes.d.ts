/**
 * Synchronise tous les index MongoDB
 * À appeler une seule fois au démarrage de l'API
 * En production, les index sont créés en arrière-plan
 */
export declare const syncIndexes: () => Promise<void>;
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
//# sourceMappingURL=indexes.d.ts.map