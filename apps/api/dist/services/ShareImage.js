"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShareImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
/**
 * Télécharge une image depuis une URL et retourne un Buffer
 */
const fetchImageBuffer = async (url) => {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Impossible de charger l'image : ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};
/**
 * Génère une image partageable pour un produit (format carré 1080x1080)
 * Optimisée pour Instagram, WhatsApp, TikTok
 */
const generateShareImage = async (options) => {
    const { productName, price, shopName, productImage, isVerified } = options;
    const WIDTH = 1080;
    const HEIGHT = 1080;
    // Télécharge et redimensionne l'image produit
    const productImageBuffer = await fetchImageBuffer(productImage);
    const productImageResized = await (0, sharp_1.default)(productImageBuffer)
        .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toBuffer();
    // Formate le prix
    const prixFormate = price.toLocaleString('fr-FR');
    // Badge vérifié
    const badgeVérifié = isVerified
        ? `<rect x="780" y="30" width="270" height="50" rx="25" fill="#06C167"/>
       <text x="915" y="63" font-family="Arial" font-size="22" font-weight="bold"
             fill="white" text-anchor="middle">✓ Boutique Vérifiée</text>`
        : '';
    // Tronque le nom si trop long
    const nomProduit = productName.length > 35
        ? productName.substring(0, 35) + '...'
        : productName;
    // Overlay SVG — bandeau bas avec prix + nom boutique
    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">

      <!-- Dégradé bas pour lisibilité -->
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect x="0" y="600" width="${WIDTH}" height="480" fill="url(#grad)"/>

      <!-- Badge vérifié (haut droite) -->
      ${badgeVérifié}

      <!-- Logo ShopEasy CI (haut gauche) -->
      <rect x="20" y="20" width="200" height="50" rx="25" fill="black" fill-opacity="0.7"/>
      <text x="120" y="53" font-family="Arial" font-size="22" font-weight="bold"
            fill="#06C167" text-anchor="middle">ShopEasy CI</text>

      <!-- Nom du produit -->
      <text x="60" y="820" font-family="Arial" font-size="48" font-weight="bold"
            fill="white">${nomProduit}</text>

      <!-- Prix -->
      <rect x="60" y="860" width="380" height="80" rx="12" fill="#06C167"/>
      <text x="250" y="915" font-family="Arial" font-size="42" font-weight="bold"
            fill="white" text-anchor="middle">${prixFormate} FCFA</text>

      <!-- Nom boutique -->
      <text x="60" y="1010" font-family="Arial" font-size="32"
            fill="#cccccc">🛍️ ${shopName}</text>

      <!-- URL -->
      <text x="${WIDTH - 60}" y="1010" font-family="Arial" font-size="28"
            fill="#06C167" text-anchor="end">shopeasyci.store</text>

    </svg>
  `;
    // Compose l'image finale : photo produit + overlay SVG
    const finalImage = await (0, sharp_1.default)(productImageResized)
        .composite([
        {
            input: Buffer.from(svgOverlay),
            top: 0,
            left: 0,
        },
    ])
        .jpeg({ quality: 92 })
        .toBuffer();
    // Upload vers Cloudinary dans le dossier share
    const url = await new Promise((resolve, reject) => {
        const { v2: cloudinary } = require('cloudinary');
        const stream = cloudinary.uploader.upload_stream({
            folder: 'shopeasy/share',
            resource_type: 'image',
        }, (error, result) => {
            if (error)
                return reject(error);
            if (!result)
                return reject(new Error('Upload échoué'));
            resolve(result.secure_url);
        });
        stream.end(finalImage);
    });
    return url;
};
exports.generateShareImage = generateShareImage;
//# sourceMappingURL=ShareImage.js.map