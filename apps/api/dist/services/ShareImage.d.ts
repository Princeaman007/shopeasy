/**
 * Options pour générer l'image partageable d'un produit
 */
interface ShareImageOptions {
    productName: string;
    price: number;
    shopName: string;
    productImage: string;
    isVerified: boolean;
}
/**
 * Génère une image partageable pour un produit (format carré 1080x1080)
 * Optimisée pour Instagram, WhatsApp, TikTok
 */
export declare const generateShareImage: (options: ShareImageOptions) => Promise<string>;
export {};
//# sourceMappingURL=ShareImage.d.ts.map