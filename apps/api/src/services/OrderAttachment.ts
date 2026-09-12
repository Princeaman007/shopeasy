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
    // Cherche toutes les commandes invite avec cet email et sans customerId
    // reel (customerId absent OU explicitement null — les deux cas sont
    // possibles selon comment la commande a ete creee)
    const result = await Order.updateMany(
      {
        'customer.email': email.toLowerCase(),
        'customer.isGuest': true,
        $or: [
          { customerId: null },
          { customerId: { $exists: false } },
        ],
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
      console.log(`${count} commande(s) rattachee(s) a l'utilisateur ${userId}`);
    }
 
    return count;
  } catch (error) {
    console.error('Erreur rattachement commandes :', error);
    return 0;
  }
}
 