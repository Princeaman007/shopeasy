"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderStatusEmail = exports.sendEmailConfirmation = exports.sendLeadNotificationEmail = exports.sendSubscriptionReminderEmail = exports.sendPasswordResetEmail = exports.sendOrderConfirmationEmail = exports.sendOrderNotificationEmail = exports.sendWelcomeEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
/**
 * Transporteur SMTP Infomaniak
 */
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.SMTP_HOST,
    port: Number(env_1.env.SMTP_PORT),
    secure: Number(env_1.env.SMTP_PORT) === 465,
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
});
/**
 * Template de base — enveloppe HTML commune à tous les emails
 */
const baseTemplate = (contenu) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body        { font-family: Inter, Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container  { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header     { background: #000000; padding: 32px; text-align: center; }
    .header h1  { color: #06C167; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .body       { padding: 32px; color: #333333; line-height: 1.6; }
    .body h2    { color: #000000; }
    .btn        { display: inline-block; background: #06C167; color: #ffffff !important;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none;
                  font-weight: bold; margin: 16px 0; }
    .footer     { background: #f9f9f9; padding: 20px 32px; text-align: center;
                  color: #888888; font-size: 13px; border-top: 1px solid #eeeeee; }
    .badge      { display: inline-block; background: #f0fdf4; color: #06C167;
                  padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛍️ ShopEasy CI</h1>
    </div>
    <div class="body">
      ${contenu}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ShopEasy CI — La boutique en ligne pour les vendeurs ivoiriens</p>
      <p>Abidjan, Côte d'Ivoire · <a href="https://shopeasyci.ci" style="color:#06C167;">shopeasyci.ci</a></p>
    </div>
  </div>
</body>
</html>
`;
// ─── Emails marchands ─────────────────────────────────────────────────────────
/**
 * Email de bienvenue après inscription
 */
const sendWelcomeEmail = async (email, name, shopSlug) => {
    const contenu = `
    <h2>Bienvenue sur ShopEasy CI, ${name} ! 🎉</h2>
    <p>Votre boutique est créée et votre essai gratuit de <strong>7 jours</strong> commence maintenant.</p>
    <p>Votre lien boutique :</p>
    <p><span class="badge">🔗 ${shopSlug}.shopeasyci.ci</span></p>
    <p>Commencez par ajouter vos premiers produits et personnaliser votre boutique.</p>
    <a href="${env_1.env.FRONTEND_URL}/dashboard" class="btn">Accéder à mon dashboard →</a>
    <p>Si vous avez des questions, notre équipe est disponible pour vous aider.</p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: '🎉 Bienvenue sur ShopEasy CI — Votre boutique est prête !',
        html: baseTemplate(contenu),
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
/**
 * Email de confirmation de commande — pour le marchand
 */
const sendOrderNotificationEmail = async (email, merchantName, order) => {
    const lignesProduits = order.items
        .map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `)
        .join('');
    const contenu = `
    <h2>Nouvelle commande reçue ! 🛍️</h2>
    <p>Bonjour <strong>${merchantName}</strong>,</p>
    <p>Vous avez reçu une nouvelle commande <span class="badge">${order.orderNumber}</span></p>

    <h3>Client</h3>
    <p>
      <strong>Nom :</strong> ${order.customerName}<br/>
      <strong>Téléphone :</strong> ${order.customerPhone}
    </p>

    <h3>Produits commandés</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f9f9f9;">
          <th style="padding:8px;text-align:left;">Produit</th>
          <th style="padding:8px;text-align:center;">Qté</th>
          <th style="padding:8px;text-align:right;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${lignesProduits}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px;font-weight:bold;">Total</td>
          <td style="padding:12px;font-weight:bold;text-align:right;color:#06C167;">
            ${order.total.toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
      </tfoot>
    </table>

    <p style="background:#fff8e1;padding:12px;border-radius:8px;margin-top:16px;">
      💰 <strong>Paiement à la livraison</strong> — Encaissez directement auprès du client.
    </p>

    <a href="${env_1.env.FRONTEND_URL}/dashboard/commandes" class="btn">Voir la commande →</a>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `🛍️ Nouvelle commande ${order.orderNumber} — ${order.total.toLocaleString('fr-FR')} FCFA`,
        html: baseTemplate(contenu),
    });
};
exports.sendOrderNotificationEmail = sendOrderNotificationEmail;
/**
 * Email de confirmation de commande — pour le client
 */
const sendOrderConfirmationEmail = async (email, customerName, order) => {
    const lignesProduits = order.items
        .map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `)
        .join('');
    const contenu = `
    <h2>Commande confirmée ! ✅</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>Votre commande <span class="badge">${order.orderNumber}</span> chez <strong>${order.shopName}</strong> a bien été reçue.</p>

    <h3>Récapitulatif</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f9f9f9;">
          <th style="padding:8px;text-align:left;">Produit</th>
          <th style="padding:8px;text-align:center;">Qté</th>
          <th style="padding:8px;text-align:right;">Prix</th>
        </tr>
      </thead>
      <tbody>${lignesProduits}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px;font-weight:bold;">Total</td>
          <td style="padding:12px;font-weight:bold;text-align:right;color:#06C167;">
            ${order.total.toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
      </tfoot>
    </table>

    <h3>Livraison</h3>
    <p>📍 ${order.address}, ${order.city}</p>
    <p style="background:#f0fdf4;padding:12px;border-radius:8px;">
      💰 <strong>Paiement à la livraison</strong> — Vous payez en recevant votre commande.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `✅ Commande ${order.orderNumber} confirmée — ${order.shopName}`,
        html: baseTemplate(contenu),
    });
};
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
/**
 * Email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${env_1.env.FRONTEND_URL}/mot-de-passe-oublie?token=${token}`;
    const contenu = `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
    <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe →</a>
    <p style="color:#888;font-size:13px;">
      Ce lien expire dans <strong>1 heure</strong>.<br/>
      Si vous n'avez pas fait cette demande, ignorez cet email.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: '🔐 Réinitialisation de votre mot de passe ShopEasy CI',
        html: baseTemplate(contenu),
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
/**
 * Email de rappel abonnement (J-3 avant expiration)
 */
const sendSubscriptionReminderEmail = async (email, name, shopName, expiresAt) => {
    const dateExpiration = expiresAt.toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
    const contenu = `
    <h2>⚠️ Votre abonnement expire bientôt</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>L'abonnement de votre boutique <strong>${shopName}</strong> expire le <strong>${dateExpiration}</strong>.</p>
    <p>Pour continuer à vendre sans interruption, renouvelez votre abonnement dès maintenant.</p>
    <a href="${env_1.env.FRONTEND_URL}/dashboard/parametres/abonnement" class="btn">Renouveler mon abonnement →</a>
    <p style="color:#888;font-size:13px;">
      Sans renouvellement, votre boutique sera suspendue après cette date.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `⚠️ Votre boutique ${shopName} expire le ${dateExpiration}`,
        html: baseTemplate(contenu),
    });
};
exports.sendSubscriptionReminderEmail = sendSubscriptionReminderEmail;
/**
 * Email de notification admin — nouveau lead Koffi
 */
const sendLeadNotificationEmail = async (lead) => {
    const contenu = `
    <h2>Nouveau lead capté par Koffi 🤖</h2>
    <p>Un prospect a été enregistré via l'agent Koffi :</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px;"><strong>Nom</strong></td>
        <td style="padding:8px;">${lead.name}</td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:8px;"><strong>Téléphone</strong></td>
        <td style="padding:8px;">${lead.phone}</td>
      </tr>
      <tr>
        <td style="padding:8px;"><strong>Email</strong></td>
        <td style="padding:8px;">${lead.email ?? '—'}</td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:8px;"><strong>Message</strong></td>
        <td style="padding:8px;">${lead.message ?? '—'}</td>
      </tr>
    </table>
    <a href="${env_1.env.FRONTEND_URL}/admin/leads" class="btn">Voir les leads →</a>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: env_1.env.ADMIN_EMAIL,
        subject: `🤖 Nouveau lead Koffi — ${lead.name} (${lead.phone})`,
        html: baseTemplate(contenu),
    });
};
exports.sendLeadNotificationEmail = sendLeadNotificationEmail;
/**
 * Email de confirmation d'inscription
 */
const sendEmailConfirmation = async (email, name, token) => {
    const confirmUrl = `${env_1.env.FRONTEND_URL}/confirmer-email?token=${token}`;
    const contenu = `
    <h2>Confirmez votre adresse email 📧</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Merci de vous être inscrit sur ShopEasy CI ! Pour activer votre compte, cliquez sur le bouton ci-dessous :</p>
    <a href="${confirmUrl}" class="btn">Confirmer mon email →</a>
    <p style="color:#888;font-size:13px;">
      Ce lien expire dans <strong>24 heures</strong>.<br/>
      Si vous n'avez pas créé de compte, ignorez cet email.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: '📧 Confirmez votre adresse email — ShopEasy CI',
        html: baseTemplate(contenu),
    });
};
exports.sendEmailConfirmation = sendEmailConfirmation;
/**
 * Email de changement de statut commande — pour le client
 */
const sendOrderStatusEmail = async (email, customerName, order) => {
    const statuts = {
        confirmed: {
            label: 'Confirmée',
            emoji: '✅',
            message: 'Votre commande a été confirmée par le marchand. Elle sera bientôt en préparation.',
        },
        shipping: {
            label: 'En livraison',
            emoji: '🚚',
            message: 'Votre commande est en route ! Le livreur vous contactera pour la livraison.',
        },
        delivered: {
            label: 'Livrée',
            emoji: '🎉',
            message: 'Votre commande a été livrée. Merci pour votre confiance !',
        },
        cancelled: {
            label: 'Annulée',
            emoji: '❌',
            message: 'Votre commande a été annulée. Contactez la boutique pour plus d\'informations.',
        },
    };
    const statut = statuts[order.status] ?? {
        label: order.status,
        emoji: '📦',
        message: 'Le statut de votre commande a été mis à jour.',
    };
    const contenu = `
    <h2>${statut.emoji} Commande ${statut.label}</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>${statut.message}</p>
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;"><strong>Commande :</strong> <span style="color:#06C167;font-weight:bold;">${order.orderNumber}</span></p>
      <p style="margin:8px 0 0;"><strong>Boutique :</strong> ${order.shopName}</p>
      <p style="margin:8px 0 0;"><strong>Total :</strong> ${order.total.toLocaleString('fr-FR')} FCFA</p>
    </div>
    <p style="color:#888;font-size:13px;">
      Pour toute question, contactez directement la boutique ${order.shopName}.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `${statut.emoji} Commande ${order.orderNumber} — ${statut.label}`,
        html: baseTemplate(contenu),
    });
};
exports.sendOrderStatusEmail = sendOrderStatusEmail;
//# sourceMappingURL=Email.js.map