import Link from 'next/link';
import { Store, Package, ShoppingCart, Banknote } from 'lucide-react';

const ETAPES = [
  {
    numero:      '01',
    icone:       Store,
    titre:       'Créez votre boutique',
    description: 'Inscrivez-vous, choisissez un thème et personnalisez votre boutique en quelques minutes. Votre lien est prêt immédiatement.',
  },
  {
    numero:      '02',
    icone:       Package,
    titre:       'Ajoutez vos produits',
    description: 'Importez vos photos depuis Instagram ou votre téléphone. Ajoutez prix, description, variantes et stock.',
  },
  {
    numero:      '03',
    icone:       ShoppingCart,
    titre:       'Partagez votre boutique',
    description: 'Partagez votre lien sur Instagram, TikTok, Facebook et WhatsApp. Vos clients commandent directement.',
  },
  {
    numero:      '04',
    icone:       Banknote,
    titre:       'Encaissez à la livraison',
    description: 'Vous recevez les commandes sur votre dashboard. Livrez et encaissez directement. 0% de commission.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <span className="text-primary text-sm font-medium">⚡ Simple et rapide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Lancez-vous en 4 étapes
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            De l'inscription à la première commande, tout est pensé pour aller vite.
          </p>
        </div>

        {/* Étapes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ETAPES.map((etape, index) => {
            const Icone = etape.icone;
            return (
              <div key={index} className="relative">
                {/* Ligne de connexion */}
                {index < ETAPES.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-full h-px bg-border z-0" />
                )}

                <div className="relative z-10 space-y-4">
                  {/* Numéro + icône */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icone size={22} className="text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-border">{etape.numero}</span>
                  </div>

                  {/* Texte */}
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-lg">{etape.titre}</h3>
                    <p className="text-muted text-sm leading-relaxed">{etape.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 text-lg"
          >
            Commencer gratuitement →
          </Link>
          <p className="text-muted text-sm mt-3">7 jours gratuits · Sans carte bancaire</p>
        </div>
      </div>
    </section>
  );
}