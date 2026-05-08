import Link from 'next/link';
import { Check, X, Zap, Crown } from 'lucide-react';

// ─── Données des plans ────────────────────────────────────────────────────────

const PLANS = [
  {
    id:          'basic',
    nom:         'Basic',
    prix:        '15 000',
    periode:     'mois',
    description: 'Parfait pour démarrer et tester votre boutique en ligne.',
    icone:       Zap,
    couleur:     'border-border',
    badge:       null,
    features: [
      { label: '10 produits maximum',               inclus: true },
      { label: '5 photos par produit',              inclus: true },
      { label: '1 vidéo par produit',  inclus: true },
      { label: '2 thèmes au choix',                 inclus: true },
      { label: 'Bouton WhatsApp intégré',           inclus: true },
      { label: 'Panier + gestion commandes',        inclus: true },
      { label: 'Stats basiques',                    inclus: true },
      { label: 'Variantes produit + stock',         inclus: true },
      { label: 'Badge vérifié',                     inclus: true },
      { label: 'Image partageable produit',         inclus: true },
      { label: 'Analytics avancés',                 inclus: false },
      { label: 'Codes promo',                       inclus: false },
      { label: 'Multi-admins',                      inclus: false },
      { label: 'Vitrine sur ShopEasy CI',           inclus: false },
    ],
  },
  {
    id:          'premium',
    nom:         'Premium',
    prix:        '30 000',
    periode:     'mois',
    description: 'Pour les vendeurs sérieux qui veulent scaler leur business.',
    icone:       Crown,
    couleur:     'border-primary',
    badge:       'Recommandé',
    features: [
      { label: 'Produits illimités',                inclus: true },
      { label: 'Photos illimitées',                 inclus: true },
      { label: '1 vidéo par produit',  inclus: true },
      { label: '5 thèmes premium',                  inclus: true },
      { label: 'Bouton WhatsApp intégré',           inclus: true },
      { label: 'Panier + gestion commandes',        inclus: true },
      { label: 'Stats basiques',                    inclus: true },
      { label: 'Variantes produit + stock',         inclus: true },
      { label: 'Badge vérifié',                     inclus: true },
      { label: 'Image partageable produit',         inclus: true },
      { label: 'Analytics avancés',                 inclus: true },
      { label: 'Codes promo',                       inclus: true },
      { label: 'Multi-admins',                      inclus: true },
      { label: 'Vitrine sur ShopEasy CI',           inclus: true },
    ],
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Tarifs() {
  return (
    <section id="tarifs" className="py-20 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <span className="text-primary text-sm font-medium"> Tarifs transparents</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Choisissez votre plan
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Commencez avec 7 jours d'essai gratuit. Pas de carte bancaire requise.
            Paiement mobile money ou virement.
          </p>
        </div>

        {/* Grille des plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const Icone = plan.icone;
            return (
              <div
                key={plan.id}
                className={`relative bg-surface rounded-2xl border-2 ${plan.couleur} p-8 flex flex-col`}
              >
                {/* Badge recommandé */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-black text-sm font-bold px-4 py-1.5 rounded-full">
                       {plan.badge}
                    </span>
                  </div>
                )}

                {/* En-tête du plan */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.id === 'premium' ? 'bg-primary' : 'bg-elevated'
                    }`}>
                      <Icone size={20} className={plan.id === 'premium' ? 'text-black' : 'text-primary'} />
                    </div>
                    <h3 className="text-white text-xl font-bold">{plan.nom}</h3>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-bold text-white">{plan.prix}</span>
                    <span className="text-muted">FCFA / {plan.periode}</span>
                  </div>

                  <p className="text-muted text-sm leading-relaxed">{plan.description}</p>
                </div>

                {/* CTA */}
                <Link
                  href="/inscription"
                  className={`block text-center font-bold py-3 px-6 rounded-xl transition-all duration-200 mb-8 ${
                    plan.id === 'premium'
                      ? 'bg-primary hover:bg-primary-hover text-black hover:scale-105'
                      : 'bg-elevated hover:bg-border text-white border border-border'
                  }`}
                >
                  Commencer l'essai gratuit →
                </Link>

                {/* Liste des features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {feature.inclus ? (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-primary" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center flex-shrink-0">
                          <X size={12} className="text-muted" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.inclus ? 'text-white' : 'text-muted line-through'}`}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Note bas de page */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-muted text-sm">
            ✅ 7 jours d'essai gratuit · ✅ Sans engagement · ✅ Paiement à la livraison pour vos clients
          </p>
          <p className="text-muted text-sm">
            Paiement par <span className="text-white">Orange Money</span>,{' '}
            <span className="text-white">Wave</span>,{' '}
            <span className="text-white">MTN Money</span> ou virement bancaire
          </p>
        </div>
      </div>
    </section>
  );
}