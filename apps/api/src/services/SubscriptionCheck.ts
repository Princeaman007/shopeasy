// ─── FICHIER COMPLET : apps/api/src/services/SubscriptionCheck.ts ─────────────

import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { sendSubscriptionReminderEmail } from './Email';

/**
 * Fait passer au statut "expired" toutes les boutiques dont la date
 * d'expiration est depassee — basic et premium confondus.
 */
export async function expirerAbonnementsPerimes(): Promise<number> {
  try {
    const maintenant = new Date();

    const result = await Shop.updateMany(
      {
        subscriptionStatus: { $in: ['trial', 'active'] },
        subscriptionExpiresAt: { $lt: maintenant },
      },
      {
        $set: { subscriptionStatus: 'expired' },
      }
    );

    const count = result.modifiedCount;
    if (count > 0) {
      console.log(`${count} boutique(s) passee(s) en statut expired`);
    }

    return count;
  } catch (error) {
    console.error('Erreur expirerAbonnementsPerimes :', error);
    return 0;
  }
}

/**
 * Envoie les rappels d'expiration a J-7, J-3 et J-0 — au marchand
 * ET a l'admin. Utilise des flags sur la boutique pour ne jamais
 * envoyer le meme rappel deux fois pour un meme cycle d'abonnement.
 *
 * A appeler manuellement (route admin dediee) tant qu'il n'y a pas
 * de vrai cron planifie.
 */
export async function envoyerRappelsExpiration(): Promise<{
  j7: number; j3: number; j0: number;
}> {
  const resultats = { j7: 0, j3: 0, j0: 0 };
  const adminEmail = process.env.ADMIN_EMAIL;

  try {
    const maintenant = new Date();

    // Toutes les boutiques encore actives ou en essai, avec une date
    // d'expiration definie
    const boutiques = await Shop.find({
      subscriptionStatus: { $in: ['trial', 'active'] },
      subscriptionExpiresAt: { $exists: true },
    }).select('name slug ownerId subscriptionExpiresAt rappelsEnvoyes planType');

    for (const shop of boutiques) {
      const joursRestants = Math.ceil(
        (shop.subscriptionExpiresAt.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)
      );

      const rappels = shop.rappelsEnvoyes ?? { j7: false, j3: false, j0: false };
      let modifie = false;

      const merchant = await User.findById(shop.ownerId).select('email name');
      if (!merchant?.email) continue;

      // ── J-7 ──────────────────────────────────────────────────────────────
      if (joursRestants <= 7 && joursRestants > 3 && !rappels.j7) {
        await envoyerAuxDeux(shop, merchant, joursRestants, adminEmail);
        rappels.j7 = true;
        modifie = true;
        resultats.j7++;
      }

      // ── J-3 ──────────────────────────────────────────────────────────────
      if (joursRestants <= 3 && joursRestants > 0 && !rappels.j3) {
        await envoyerAuxDeux(shop, merchant, joursRestants, adminEmail);
        rappels.j3 = true;
        modifie = true;
        resultats.j3++;
      }

      // ── J-0 — le jour meme ou deja depasse ────────────────────────────────
      if (joursRestants <= 0 && !rappels.j0) {
        await envoyerAuxDeux(shop, merchant, joursRestants, adminEmail);
        rappels.j0 = true;
        modifie = true;
        resultats.j0++;
      }

      if (modifie) {
        shop.rappelsEnvoyes = rappels;
        await shop.save();
      }
    }

    return resultats;
  } catch (error) {
    console.error('Erreur envoyerRappelsExpiration :', error);
    return resultats;
  }
}

// ── Helper — envoie le meme rappel au marchand et a l'admin ───────────────────
async function envoyerAuxDeux(
  shop: any,
  merchant: { email: string; name: string },
  joursRestants: number,
  adminEmail?: string
) {
  try {
    await sendSubscriptionReminderEmail(merchant.email, merchant.name, {
      shopName:      shop.name,
      shopSlug:      shop.slug,
      planType:      shop.planType,
      joursRestants,
      expiresAt:     shop.subscriptionExpiresAt,
      destinataire:  'marchand',
    });
  } catch (emailErr) {
    console.error('Erreur email rappel marchand :', emailErr);
  }

  if (adminEmail) {
    try {
      await sendSubscriptionReminderEmail(adminEmail, 'Admin', {
        shopName:      shop.name,
        shopSlug:      shop.slug,
        planType:      shop.planType,
        joursRestants,
        expiresAt:     shop.subscriptionExpiresAt,
        destinataire:  'admin',
        merchantEmail: merchant.email,
        merchantName:  merchant.name,
      });
    } catch (emailErr) {
      console.error('Erreur email rappel admin :', emailErr);
    }
  }
}