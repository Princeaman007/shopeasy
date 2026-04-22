import { Order } from '../models/Order';

/**
 * Rattache les commandes passées en invité à un compte client
 * Appelé après inscription ou connexion
 */
export async function rattacherCommandesInvite(
  userId: string,
  email: string
): Promise<number> {
  try {
    // Cherche toutes les commandes invité avec cet email sans customerId
    const result = await Order.updateMany(
      {
        'customer.email': email.toLowerCase(),
        'customer.isGuest': true,
        customerId: { $exists: false },
      },
      {
        $set: {
          customerId: userId,
          'customer.isGuest': false,
        },
      }
    );

    const count = result.modifiedCount;
    if (count > 0) {
      console.log(`✅ ${count} commande(s) rattachée(s) à l'utilisateur ${userId}`);
    }

    return count;
  } catch (error) {
    console.error('Erreur rattachement commandes :', error);
    return 0;
  }
}