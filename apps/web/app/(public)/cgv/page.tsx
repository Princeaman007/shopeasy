import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente  ShopEasy CI',
  description: 'Conditions générales de vente applicables aux boutiques ShopEasy CI',
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">

        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Accueil
        </Link>

        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShoppingBag size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conditions Générales de Vente</h1>
            <p className="text-muted text-sm">Dernière mise à jour : Avril 2026</p>
          </div>
        </div>

        <div className="space-y-8">

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <p className="text-primary text-sm">
               Ces conditions s'appliquent aux transactions entre les marchands utilisant
              ShopEasy CI et leurs clients finaux.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 1  Champ d'application</h2>
            <p className="text-muted text-sm leading-relaxed">
              Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les ventes
              réalisées via les boutiques en ligne hébergées sur la plateforme ShopEasy CI.
              Chaque marchand est responsable de ses propres conditions de vente. ShopEasy CI
              agit uniquement en tant que prestataire technique.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 2  Commandes</h2>
            <p className="text-muted text-sm leading-relaxed">
              Toute commande passée via une boutique ShopEasy CI constitue un contrat de vente
              entre l'acheteur et le marchand concerné. La commande est confirmée lorsque le
              marchand l'accepte via son tableau de bord ou par WhatsApp.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Le marchand se réserve le droit d'annuler une commande en cas de rupture de stock
              ou d'erreur de prix manifeste, avec notification de l'acheteur dans les 24 heures.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 3  Prix et paiement</h2>
            <p className="text-muted text-sm leading-relaxed">
              Les prix affichés sur les boutiques sont en Francs CFA (FCFA) et sont fixés par
              chaque marchand. Le paiement s'effectue généralement à la livraison (paiement
              contre remboursement). Certains marchands peuvent proposer des paiements anticipés
              via Mobile Money (Orange Money, Wave, MTN Money).
            </p>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI ne collecte aucun paiement de la part des acheteurs finaux. Toute
              transaction financière se fait directement entre le marchand et l'acheteur.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 4  Livraison</h2>
            <p className="text-muted text-sm leading-relaxed">
              Les conditions et délais de livraison sont définis par chaque marchand. En général :
            </p>
            <ul className="text-muted text-sm space-y-2 ml-4 list-disc">
              <li>Livraison à Abidjan : 24 à 48 heures ouvrées.</li>
              <li>Livraison en province : 2 à 5 jours ouvrés selon la localité.</li>
              <li>Les frais de livraison sont précisés par le marchand lors de la confirmation.</li>
            </ul>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI ne gère pas la logistique et n'est pas responsable des retards ou
              problèmes de livraison.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 5  Retours et remboursements</h2>
            <p className="text-muted text-sm leading-relaxed">
              Chaque marchand définit sa propre politique de retour. En cas de produit défectueux
              ou non conforme à la description, l'acheteur dispose de 48 heures après réception
              pour contacter le marchand et demander un échange ou un remboursement.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Les remboursements sont effectués par le marchand directement à l'acheteur, selon
              le même mode de paiement utilisé lors de l'achat.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 6  Garanties</h2>
            <p className="text-muted text-sm leading-relaxed">
              Les produits vendus via ShopEasy CI bénéficient des garanties légales prévues par
              le droit ivoirien. Le marchand est responsable de la conformité des produits vendus
              avec leur description sur la boutique.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 7  Litiges</h2>
            <p className="text-muted text-sm leading-relaxed">
              En cas de litige entre un acheteur et un marchand, les parties s'engagent à
              rechercher une solution amiable. ShopEasy CI peut, à titre exceptionnel, servir
              d'intermédiaire pour faciliter la résolution du conflit, sans y être obligé.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Les présentes CGV sont soumises au droit ivoirien. Les tribunaux compétents
              d'Abidjan seront seuls compétents en cas de litige non résolu à l'amiable.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-2">
            <h2 className="text-white font-bold text-lg">Contact</h2>
            <p className="text-muted text-sm">
              Pour toute réclamation ou question :{' '}
              <a href="mailto:contact@shopeasyci.ci" className="text-primary hover:underline">
                contact@shopeasyci.ci
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}