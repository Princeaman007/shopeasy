export declare class ShopService {
    /**
     * Génère un slug unique pour la boutique
     */
    static generateUniqueSlug(name: string): Promise<string>;
    /**
     * Crée les catégories prédéfinies pour une nouvelle boutique
     */
    static createDefaultCategories(shopId: string): Promise<void>;
}
//# sourceMappingURL=ShopService.d.ts.map