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
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f0f0f0;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .wrapper {
      padding: 40px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      background: #000000;
      padding: 28px 40px;
      text-align: center;
    }
    .header-brand {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .header-brand span {
      color: #06C167;
    }
    .header-tagline {
      color: #888888;
      font-size: 12px;
      margin-top: 4px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .body {
      padding: 36px 40px;
      line-height: 1.7;
      color: #333333;
    }
    .body h2 {
      color: #111111;
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 16px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #06C167;
    }
    .body p {
      margin: 0 0 14px 0;
      font-size: 15px;
    }
    .btn {
      display: inline-block;
      background: #06C167;
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      margin: 20px 0;
      letter-spacing: 0.3px;
    }
    .btn:hover {
      background: #05a558;
    }
    .badge {
      display: inline-block;
      background: #f0fdf4;
      color: #06C167;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid #06C16730;
    }
    .info-box {
      background: #f8f8f8;
      border-left: 3px solid #06C167;
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin: 16px 0;
      font-size: 14px;
    }
    .info-box strong {
      color: #111111;
    }
    .warning-box {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin: 16px 0;
      font-size: 14px;
      color: #92400e;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    table th {
      background: #f8f8f8;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #555555;
      border-bottom: 1px solid #eeeeee;
    }
    table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      color: #333333;
    }
    table tfoot td {
      font-weight: 700;
      font-size: 15px;
      border-top: 2px solid #eeeeee;
      border-bottom: none;
      padding-top: 14px;
    }
    .total-amount {
      color: #06C167;
    }
    .divider {
      border: none;
      border-top: 1px solid #eeeeee;
      margin: 24px 0;
    }
    .note {
      color: #888888;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      background: #f8f8f8;
      padding: 24px 40px;
      text-align: center;
      color: #999999;
      font-size: 12px;
      border-top: 1px solid #eeeeee;
    }
    .footer a {
      color: #06C167;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-brand">Shop<span>Easy</span> CI</div>
        <div class="header-tagline">Plateforme de commerce en ligne</div>
      </div>
      <div class="body">
        ${contenu}
      </div>
      <div class="footer">
        <p style="margin:0 0 6px 0;">
          &copy; ${new Date().getFullYear()} ShopEasy CI &mdash; Tous droits réservés
        </p>
        <p style="margin:0;">
          Abidjan, Côte d'Ivoire &nbsp;&middot;&nbsp;
          <a href="https://www.shopeasyci.store">www.shopeasyci.store</a>
        </p>
      </div>
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
    <h2>Bienvenue sur ShopEasy CI</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>
      Votre boutique a été créée avec succès. Votre période d'essai gratuite de
      <strong>7 jours</strong> est maintenant active.
    </p>
    <div class="info-box">
      <strong>Votre adresse boutique :</strong><br/>
      <span style="color:#06C167;font-weight:600;">${shopSlug}.shopeasyci.store</span>
    </div>
    <p>Pour bien démarrer, nous vous recommandons de :</p>
    <ul style="margin:0 0 16px 0;padding-left:20px;font-size:15px;">
      <li style="margin-bottom:8px;">Ajouter vos premiers produits</li>
      <li style="margin-bottom:8px;">Personnaliser le thème de votre boutique</li>
      <li style="margin-bottom:8px;">Compléter votre page À propos</li>
      <li>Partager votre lien boutique sur vos réseaux sociaux</li>
    </ul>
    <a href="${env_1.env.FRONTEND_URL}/dashboard" class="btn">Accéder à mon tableau de bord</a>
    <hr class="divider" />
    <p class="note">
      Notre équipe reste disponible pour vous accompagner.
      N'hésitez pas à nous contacter si vous avez des questions.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: 'Bienvenue sur ShopEasy CI — Votre boutique est prête',
        html: baseTemplate(contenu),
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
/**
 * Email de notification de commande — pour le marchand
 */
const sendOrderNotificationEmail = async (email, merchantName, order) => {
    const lignesProduits = order.items
        .map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `)
        .join('');
    const contenu = `
    <h2>Nouvelle commande reçue</h2>
    <p>Bonjour <strong>${merchantName}</strong>,</p>
    <p>
      Vous avez reçu une nouvelle commande.
      Référence : <span class="badge">${order.orderNumber}</span>
    </p>

    <div class="info-box">
      <strong>Informations client</strong><br/>
      Nom : ${order.customerName}<br/>
      Téléphone : ${order.customerPhone}
    </div>

    <strong style="font-size:14px;color:#555555;display:block;margin-bottom:8px;">
      DÉTAIL DE LA COMMANDE
    </strong>
    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th style="text-align:center;">Qté</th>
          <th style="text-align:right;">Prix unitaire</th>
        </tr>
      </thead>
      <tbody>${lignesProduits}</tbody>
      <tfoot>
        <tr>
          <td colspan="2">Montant total</td>
          <td style="text-align:right;" class="total-amount">
            ${order.total.toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="info-box">
      <strong>Mode de paiement :</strong> Paiement à la livraison<br/>
      Encaissez le montant directement auprès du client lors de la livraison.
    </div>

    <a href="${env_1.env.FRONTEND_URL}/dashboard/commandes" class="btn">Gérer cette commande</a>

    <hr class="divider" />
    <p class="note">
      Pensez à confirmer la commande rapidement pour informer votre client
      et maintenir un bon niveau de satisfaction.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `Nouvelle commande ${order.orderNumber} — ${order.total.toLocaleString('fr-FR')} FCFA`,
        html: baseTemplate(contenu),
    });
};
exports.sendOrderNotificationEmail = sendOrderNotificationEmail;
/**
 * Email de confirmation de commande — pour le client
 */
const sendOrderConfirmationEmail = async (email, customerName, order) => {
    const lignesProduits = order.items
        .map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `)
        .join('');
    const contenu = `
    <h2>Confirmation de votre commande</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>
      Votre commande <span class="badge">${order.orderNumber}</span> passée auprès de
      <strong>${order.shopName}</strong> a bien été enregistrée.
    </p>

    <strong style="font-size:14px;color:#555555;display:block;margin-bottom:8px;">
      RÉCAPITULATIF DE LA COMMANDE
    </strong>
    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th style="text-align:center;">Qté</th>
          <th style="text-align:right;">Prix</th>
        </tr>
      </thead>
      <tbody>${lignesProduits}</tbody>
      <tfoot>
        <tr>
          <td colspan="2">Montant total</td>
          <td style="text-align:right;" class="total-amount">
            ${order.total.toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="info-box">
      <strong>Adresse de livraison :</strong><br/>
      ${order.address}, ${order.city}
    </div>

    <div class="info-box">
      <strong>Mode de paiement :</strong> Paiement à la livraison<br/>
      Vous réglez le montant directement au livreur lors de la réception de votre commande.
    </div>

    <hr class="divider" />
    <p class="note">
      Le marchand va traiter votre commande et vous contacter pour confirmer
      les modalités de livraison. Pour toute question, contactez directement
      la boutique <strong>${order.shopName}</strong>.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `Commande ${order.orderNumber} confirmée — ${order.shopName}`,
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
    <p>
      Nous avons reçu une demande de réinitialisation du mot de passe associé
      à votre compte ShopEasy CI. Cliquez sur le bouton ci-dessous pour
      définir un nouveau mot de passe :
    </p>
    <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
    <hr class="divider" />
    <p class="note">
      Ce lien est valable pendant <strong>1 heure</strong>.<br/>
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer
      cet email en toute sécurité. Votre mot de passe restera inchangé.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe — ShopEasy CI',
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
    <h2>Votre abonnement arrive à expiration</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>
      Nous vous informons que l'abonnement de votre boutique
      <strong>${shopName}</strong> expirera le <strong>${dateExpiration}</strong>.
    </p>
    <p>
      Pour assurer la continuité de votre activité sans interruption,
      nous vous invitons à renouveler votre abonnement dès maintenant.
    </p>
    <a href="${env_1.env.FRONTEND_URL}/dashboard/parametres/abonnement" class="btn">
      Renouveler mon abonnement
    </a>
    <hr class="divider" />
    <div class="warning-box">
      Passé la date d'expiration, votre boutique sera temporairement suspendue
      et vos clients ne pourront plus passer de commandes.
    </div>
    <p class="note">
      Pour toute question concernant votre abonnement, n'hésitez pas
      à contacter notre équipe.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `Votre boutique ${shopName} — Abonnement expirant le ${dateExpiration}`,
        html: baseTemplate(contenu),
    });
};
exports.sendSubscriptionReminderEmail = sendSubscriptionReminderEmail;
/**
 * Email de notification admin — nouveau lead Koffi
 */
const sendLeadNotificationEmail = async (lead) => {
    const contenu = `
    <h2>Nouveau prospect enregistré</h2>
    <p>Un visiteur a été capté via l'agent Koffi sur la page d'accueil.</p>

    <strong style="font-size:14px;color:#555555;display:block;margin-bottom:8px;">
      INFORMATIONS DU PROSPECT
    </strong>
    <table>
      <tr>
        <td style="width:140px;"><strong>Nom</strong></td>
        <td>${lead.name}</td>
      </tr>
      <tr>
        <td><strong>Téléphone</strong></td>
        <td>${lead.phone}</td>
      </tr>
      <tr>
        <td><strong>Email</strong></td>
        <td>${lead.email ?? 'Non renseigné'}</td>
      </tr>
      <tr>
        <td><strong>Message</strong></td>
        <td>${lead.message ?? 'Aucun message'}</td>
      </tr>
    </table>

    <a href="${env_1.env.FRONTEND_URL}/admin/leads" class="btn">Voir tous les prospects</a>

    <hr class="divider" />
    <p class="note">
      Nous vous recommandons de contacter ce prospect dans les plus brefs délais
      pour maximiser les chances de conversion.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: env_1.env.ADMIN_EMAIL,
        subject: `Nouveau prospect — ${lead.name} (${lead.phone})`,
        html: baseTemplate(contenu),
    });
};
exports.sendLeadNotificationEmail = sendLeadNotificationEmail;
/**
 * Email de confirmation d'adresse email
 */
const sendEmailConfirmation = async (email, name, token) => {
    const confirmUrl = `${env_1.env.FRONTEND_URL}/confirmer-email?token=${token}`;
    const contenu = `
    <h2>Confirmez votre adresse email</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>
      Merci de vous être inscrit sur ShopEasy CI. Pour activer votre compte
      et accéder à votre tableau de bord, veuillez confirmer votre adresse
      email en cliquant sur le bouton ci-dessous :
    </p>
    <a href="${confirmUrl}" class="btn">Confirmer mon adresse email</a>
    <hr class="divider" />
    <p class="note">
      Ce lien est valable pendant <strong>24 heures</strong>.<br/>
      Si vous n'avez pas créé de compte sur ShopEasy CI, vous pouvez
      ignorer cet email en toute sécurité.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: 'Confirmez votre adresse email — ShopEasy CI',
        html: baseTemplate(contenu),
    });
};
exports.sendEmailConfirmation = sendEmailConfirmation;
/**
 * Email de mise à jour du statut de commande — pour le client
 */
const sendOrderStatusEmail = async (email, customerName, order) => {
    const statuts = {
        confirmed: {
            label: 'Confirmée',
            message: 'Votre commande a été confirmée par le marchand et est en cours de préparation.',
        },
        shipping: {
            label: 'En cours de livraison',
            message: 'Votre commande est en route. Le livreur vous contactera pour convenir de la livraison.',
        },
        delivered: {
            label: 'Livrée',
            message: 'Votre commande a été livrée avec succès. Merci pour votre confiance.',
        },
        cancelled: {
            label: 'Annulée',
            message: 'Votre commande a été annulée. Veuillez contacter la boutique pour plus d\'informations.',
        },
    };
    const statut = statuts[order.status] ?? {
        label: order.status,
        message: 'Le statut de votre commande a été mis à jour.',
    };
    const contenu = `
    <h2>Mise à jour de votre commande</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>${statut.message}</p>

    <div class="info-box">
      <strong>Référence commande :</strong>
      <span style="color:#06C167;font-weight:700;"> ${order.orderNumber}</span><br/>
      <strong>Statut :</strong> ${statut.label}<br/>
      <strong>Boutique :</strong> ${order.shopName}<br/>
      <strong>Montant :</strong> ${order.total.toLocaleString('fr-FR')} FCFA
    </div>

    <hr class="divider" />
    <p class="note">
      Pour toute question concernant votre commande, contactez directement
      la boutique <strong>${order.shopName}</strong>.
    </p>
  `;
    await transporter.sendMail({
        from: `"ShopEasy CI" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: `Commande ${order.orderNumber} — ${statut.label}`,
        html: baseTemplate(contenu),
    });
};
exports.sendOrderStatusEmail = sendOrderStatusEmail;
//# sourceMappingURL=Email.js.map