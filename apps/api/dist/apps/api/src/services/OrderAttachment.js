"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rattacherCommandesInvite = rattacherCommandesInvite;
const Order_1 = require("../models/Order");
/**
 * Rattache les commandes passées en invité à un compte client
 * Appelé après inscription ou connexion
 */
async function rattacherCommandesInvite(userId, email) {
    try {
        // Cherche toutes les commandes invité avec cet email sans customerId
        const result = await Order_1.Order.updateMany({
            'customer.email': email.toLowerCase(),
            'customer.isGuest': true,
            customerId: { $exists: false },
        }, {
            $set: {
                customerId: userId,
                'customer.isGuest': false,
            },
        });
        const count = result.modifiedCount;
        if (count > 0) {
            console.log(`✅ ${count} commande(s) rattachée(s) à l'utilisateur ${userId}`);
        }
        return count;
    }
    catch (error) {
        console.error('Erreur rattachement commandes :', error);
        return 0;
    }
}
//# sourceMappingURL=OrderAttachment.js.map