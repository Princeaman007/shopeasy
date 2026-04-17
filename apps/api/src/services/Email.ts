import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Transporteur SMTP Infomaniak
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Envoie un email de reset de mot de passe
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/mot-de-passe-oublie/reset?token=${resetToken}`;

  await transporter.sendMail({
    from: `"ShopEasy CI" <${env.SMTP_USER}>`,
    to: email,
    subject: 'Reinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="color: #06C167; margin-bottom: 8px;">ShopEasy CI</h1>
        <h2 style="color: #fff; margin-bottom: 24px;">Reinitialisation de mot de passe</h2>
        <p style="color: #888; margin-bottom: 8px;">Bonjour ${name},</p>
        <p style="color: #888; margin-bottom: 32px;">
          Vous avez demande a reinitialiser votre mot de passe.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          Ce lien est valable pendant <strong style="color: #fff;">1 heure</strong>.
        </p>
        <a href="${resetUrl}"
          style="display: inline-block; background: #06C167; color: #fff;
                 padding: 14px 28px; border-radius: 8px; text-decoration: none;
                 font-weight: 600; font-size: 16px;">
          Reinitialiser mon mot de passe
        </a>
        <p style="color: #444; margin-top: 32px; font-size: 14px;">
          Si vous n'avez pas fait cette demande, ignorez cet email.
          Votre mot de passe ne sera pas modifie.
        </p>
        <hr style="border-color: #2a2a2a; margin: 32px 0;" />
        <p style="color: #444; font-size: 12px;">
          ShopEasy CI — La boutique en ligne pour les vendeurs ivoiriens
        </p>
      </div>
    `,
  });
};

/**
 * Envoie un email de confirmation de commande au client
 */
export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  orderNumber: string,
  shopName: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"${shopName}" <${env.SMTP_USER}>`,
    to: email,
    subject: `Commande ${orderNumber} confirmee`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="color: #06C167;">Commande recue !</h1>
        <p style="color: #888;">Bonjour ${name},</p>
        <p style="color: #888;">
          Votre commande <strong style="color: #fff;">${orderNumber}</strong>
          a bien ete recue par <strong style="color: #fff;">${shopName}</strong>.
        </p>
        <p style="color: #888;">
          Le marchand vous contactera bientot pour confirmer la livraison.
          Le paiement se fait a la livraison.
        </p>
        <hr style="border-color: #2a2a2a; margin: 32px 0;" />
        <p style="color: #444; font-size: 12px;">ShopEasy CI</p>
      </div>
    `,
  });
};