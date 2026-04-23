import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation  ShopEasy CI',
  description: 'Conditions générales d\'utilisation de la plateforme ShopEasy CI',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">

        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Accueil
        </Link>

        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conditions Générales d'Utilisation</h1>
            <p className="text-muted text-sm">Dernière mise à jour : Avril 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">

          {/* Article 1 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 1  Présentation de ShopEasy CI</h2>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI est une plateforme SaaS (Software as a Service) permettant à des vendeurs
              basés en Côte d'Ivoire de créer et gérer une boutique en ligne. La plateforme est
              éditée et exploitée par ShopEasy CI. En utilisant nos services, vous acceptez
              pleinement et sans réserve les présentes conditions générales d'utilisation.
            </p>
          </div>

          {/* Article 2 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 2  Accès au service</h2>
            <p className="text-muted text-sm leading-relaxed">
              L'accès à ShopEasy CI est réservé aux personnes physiques ou morales ayant la capacité
              juridique de contracter. L'inscription est gratuite pour une période d'essai de 7 jours.
              Au-delà, un abonnement payant est requis pour continuer à utiliser la plateforme.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.
              Toute utilisation du compte est présumée effectuée par le titulaire du compte.
            </p>
          </div>

          {/* Article 3 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 3  Abonnements et paiements</h2>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI propose deux plans tarifaires :
            </p>
            <ul className="text-muted text-sm space-y-2 ml-4 list-disc">
              <li><strong className="text-white">Plan Basic</strong> : 15 000 FCFA/mois  jusqu'à 10 produits, 2 thèmes, fonctionnalités de base.</li>
              <li><strong className="text-white">Plan Premium</strong> : 30 000 FCFA/mois  produits illimités, 5 thèmes, analytics avancés, codes promo, multi-admins.</li>
            </ul>
            <p className="text-muted text-sm leading-relaxed">
              Le paiement s'effectue mensuellement via Orange Money, Wave, MTN Money ou virement bancaire.
              Tout abonnement commencé est dû en totalité. Aucun remboursement ne sera effectué pour
              une période entamée.
            </p>
          </div>

          {/* Article 4 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 4  Obligations du marchand</h2>
            <p className="text-muted text-sm leading-relaxed">
              En utilisant ShopEasy CI, le marchand s'engage à :
            </p>
            <ul className="text-muted text-sm space-y-2 ml-4 list-disc">
              <li>Fournir des informations exactes et à jour sur sa boutique et ses produits.</li>
              <li>Ne pas vendre de produits illicites, contrefaits, dangereux ou interdits par la loi ivoirienne.</li>
              <li>Respecter les droits des consommateurs et honorer les commandes passées.</li>
              <li>Ne pas utiliser la plateforme à des fins frauduleuses ou trompeuses.</li>
              <li>Assurer le service après-vente et la livraison de ses produits.</li>
            </ul>
          </div>

          {/* Article 5 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 5  Responsabilités</h2>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI agit en tant que prestataire technique. Nous ne sommes pas partie aux
              transactions entre marchands et acheteurs. La responsabilité de ShopEasy CI ne saurait
              être engagée en cas de litige entre un marchand et un client final.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI s'engage à maintenir la disponibilité de la plateforme à hauteur de 99%
              par mois, hors maintenance planifiée. En cas d'indisponibilité prolongée, une
              compensation pourra être accordée sous forme de prolongation d'abonnement.
            </p>
          </div>

          {/* Article 6 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 6  Propriété intellectuelle</h2>
            <p className="text-muted text-sm leading-relaxed">
              Le contenu publié par les marchands (photos, textes, logos) reste leur propriété.
              En publiant du contenu sur ShopEasy CI, le marchand accorde à la plateforme une
              licence non exclusive d'utilisation à des fins de promotion de la plateforme.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              La marque ShopEasy CI, son logo, son code source et son design sont la propriété
              exclusive de ShopEasy CI. Toute reproduction est interdite sans autorisation écrite.
            </p>
          </div>

          {/* Article 7 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 7  Protection des données personnelles</h2>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI collecte les données suivantes : nom, email, numéro de téléphone, et
              informations de boutique. Ces données sont utilisées exclusivement pour :
            </p>
            <ul className="text-muted text-sm space-y-2 ml-4 list-disc">
              <li>La gestion de votre compte et de votre boutique.</li>
              <li>L'envoi de notifications liées à votre activité (commandes, paiements).</li>
              <li>L'amélioration de nos services.</li>
            </ul>
            <p className="text-muted text-sm leading-relaxed">
              Vos données ne sont jamais vendues à des tiers. Vous pouvez demander la suppression
              de votre compte et de vos données à tout moment en nous contactant.
            </p>
          </div>

          {/* Article 8 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 8  Résiliation</h2>
            <p className="text-muted text-sm leading-relaxed">
              Le marchand peut résilier son abonnement à tout moment depuis son tableau de bord.
              La résiliation prend effet à la fin de la période d'abonnement en cours. Les données
              de la boutique sont conservées pendant 30 jours après la résiliation, puis supprimées.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              ShopEasy CI se réserve le droit de suspendre ou supprimer tout compte en cas de
              violation des présentes CGU, sans préavis ni remboursement.
            </p>
          </div>

          {/* Article 9 */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-lg">Article 9  Droit applicable</h2>
            <p className="text-muted text-sm leading-relaxed">
              Les présentes CGU sont soumises au droit ivoirien. En cas de litige, les parties
              s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut,
              les tribunaux compétents d'Abidjan seront seuls compétents.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-2">
            <h2 className="text-white font-bold text-lg">Contact</h2>
            <p className="text-muted text-sm">
              Pour toute question relative aux présentes CGU, contactez-nous à :{' '}
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