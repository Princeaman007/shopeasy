import Link from 'next/link';
import { Crown } from 'lucide-react';

// ─── Données des thèmes ───────────────────────────────────────────────────────

const THEMES = [
  {
    id:          'vitrine-moderne',
    nom:         'Vitrine Moderne',
    plan:        'basic',
    description: 'Élégant et épuré. Parfait pour la mode et les accessoires.',
    couleurPrimaire: '#10b981',
    couleurFond:     '#0f172a',
    couleurCarte:    '#1e293b',
    preview: [
      { nom: 'Robe Élégante',  prix: '25 000' },
      { nom: 'Sac à Main',     prix: '35 000' },
      { nom: 'Chaussures',     prix: '18 000' },
    ],
  },
  {
    id:          'marche-colore',
    nom:         'Marché Coloré',
    plan:        'basic',
    description: 'Chaleureux et vivant. Idéal pour l\'alimentation et l\'artisanat.',
    couleurPrimaire: '#f59e0b',
    couleurFond:     '#1c1917',
    couleurCarte:    '#292524',
    preview: [
      { nom: 'Attiéké Frais',  prix: '2 500' },
      { nom: 'Alloco Maison',  prix: '1 500' },
      { nom: 'Jus Gingembre',  prix: '3 000' },
    ],
  },
  {
    id:          'luxe-sombre',
    nom:         'Luxe Sombre',
    plan:        'premium',
    description: 'Sophistiqué et luxueux. Pour les marques haut de gamme.',
    couleurPrimaire: '#d97706',
    couleurFond:     '#0c0a09',
    couleurCarte:    '#1c1917',
    preview: [
      { nom: 'Montre Or',      prix: '150 000' },
      { nom: 'Parfum Rare',    prix: '85 000' },
      { nom: 'Bijou Exclusif', prix: '200 000' },
    ],
  },
  {
    id:          'boutique-pro',
    nom:         'Boutique Pro',
    plan:        'premium',
    description: 'Professionnel et moderne. Pour les boutiques multisecteurs.',
    couleurPrimaire: '#0ea5e9',
    couleurFond:     '#ffffff',
    couleurCarte:    '#f8fafc',
    texteCouleur:    '#0f172a',
    preview: [
      { nom: 'Laptop Pro',     prix: '450 000' },
      { nom: 'Smartphone',     prix: '280 000' },
      { nom: 'Écouteurs',      prix: '45 000' },
    ],
  },
  {
    id:          'stories-style',
    nom:         'Stories Style',
    plan:        'premium',
    description: 'Tendance et dynamique. Inspiré des stories Instagram.',
    couleurPrimaire: '#8b5cf6',
    couleurFond:     '#18181b',
    couleurCarte:    '#27272a',
    preview: [
      { nom: 'Sneakers',       prix: '55 000' },
      { nom: 'Casquette',      prix: '12 000' },
      { nom: 'Hoodie',         prix: '28 000' },
    ],
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Themes() {
  return (
    <section id="themes" className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <span className="text-primary text-sm font-medium"> 5 thèmes disponibles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Une boutique à votre image
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Choisissez parmi 5 thèmes professionnels et personnalisez votre boutique
            en quelques clics.
          </p>
        </div>

        {/* Grille des thèmes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className="group relative bg-bg border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Badge Premium */}
              {theme.plan === 'premium' && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-primary/30 rounded-full px-2.5 py-1">
                  <Crown size={10} className="text-primary" />
                  <span className="text-primary text-xs font-medium">Premium</span>
                </div>
              )}

              {/* Aperçu du thème */}
              <div
                className="h-48 p-4 relative overflow-hidden"
                style={{ backgroundColor: theme.couleurFond }}
              >
                {/* Barre navigateur miniature */}
                <div
                  className="rounded-t-lg overflow-hidden mb-2"
                  style={{ backgroundColor: theme.couleurCarte }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    <div
                      className="flex-1 rounded px-2 py-0.5 text-center"
                      style={{ backgroundColor: theme.couleurFond }}
                    >
                      <span className="text-xs" style={{ color: theme.couleurPrimaire, fontSize: '8px' }}>
                        maboutique.shopeasyci.ci
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini grille produits */}
                <div className="grid grid-cols-3 gap-1.5">
                  {theme.preview.map((produit, i) => (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden"
                      style={{ backgroundColor: theme.couleurCarte }}
                    >
                      <div
                        className="h-10 flex items-center justify-center text-lg"
                        style={{ backgroundColor: theme.couleurPrimaire + '20' }}
                      >
                        
                      </div>
                      <div className="p-1">
                        <p
                          className="text-center font-bold"
                          style={{ color: theme.couleurPrimaire, fontSize: '7px' }}
                        >
                          {produit.prix} F
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bouton WhatsApp simulé */}
                <div
                  className="mt-2 rounded-lg py-1 text-center text-xs font-medium"
                  style={{
                    backgroundColor: theme.couleurPrimaire + '20',
                    color: theme.couleurPrimaire,
                    fontSize: '9px',
                  }}
                >
                   Commander via WhatsApp
                </div>
              </div>

              {/* Infos du thème */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">{theme.nom}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: theme.couleurPrimaire + '20',
                      color: theme.couleurPrimaire,
                    }}
                  >
                    {theme.plan === 'basic' ? 'Basic' : 'Premium'}
                  </span>
                </div>
                <p className="text-muted text-sm">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
          >
            Choisir mon thème →
          </Link>
          <p className="text-muted text-sm mt-3">
            Vous pouvez changer de thème à tout moment depuis votre dashboard
          </p>
        </div>
      </div>
    </section>
  );
}