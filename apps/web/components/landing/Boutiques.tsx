import Link from 'next/link';
import { ShoppingBag, Star, MapPin } from 'lucide-react';

// ─── Données simulées — remplacées par l'API en production ───────────────────

const BOUTIQUES = [
  {
    id:       '1',
    slug:     'aya-fashion',
    nom:      'Aya Fashion',
    categorie: 'Mode & Accessoires',
    ville:    'Abidjan, Cocody',
    theme:    'vitrine-moderne',
    produits: 8,
    couleur:  '#10b981',
    emoji:    '👗',
    badge:    true,
    produitsMockup: [
      { nom: 'Robe Wax',    prix: '15 000', bg: 'bg-purple-500/20' },
      { nom: 'Sac Cuir',    prix: '25 000', bg: 'bg-blue-500/20' },
      { nom: 'Sandales',    prix: '8 000',  bg: 'bg-orange-500/20' },
    ],
  },
  {
    id:       '2',
    slug:     'delices-dafrique',
    nom:      "Délices d'Afrique",
    categorie: 'Alimentation',
    ville:    'Abidjan, Yopougon',
    theme:    'marche-colore',
    produits: 10,
    couleur:  '#f59e0b',
    emoji:    '🍽️',
    badge:    true,
    produitsMockup: [
      { nom: 'Attiéké',     prix: '2 500',  bg: 'bg-yellow-500/20' },
      { nom: 'Alloco',      prix: '1 500',  bg: 'bg-red-500/20' },
      { nom: 'Kedjenou',    prix: '5 000',  bg: 'bg-green-500/20' },
    ],
  },
  {
    id:       '3',
    slug:     'luxe-bijoux',
    nom:      'Luxe & Bijoux',
    categorie: 'Bijouterie',
    ville:    'Abidjan, Plateau',
    theme:    'luxe-sombre',
    produits: 6,
    couleur:  '#d97706',
    emoji:    '💎',
    badge:    true,
    produitsMockup: [
      { nom: 'Collier Or',  prix: '85 000', bg: 'bg-yellow-500/20' },
      { nom: 'Bague',       prix: '45 000', bg: 'bg-amber-500/20' },
      { nom: 'Bracelet',    prix: '35 000', bg: 'bg-orange-500/20' },
    ],
  },
  {
    id:       '4',
    slug:     'tech-abidjan',
    nom:      'Tech Abidjan',
    categorie: 'Électronique',
    ville:    'Abidjan, Marcory',
    theme:    'boutique-pro',
    produits: 9,
    couleur:  '#0ea5e9',
    emoji:    '📱',
    badge:    false,
    produitsMockup: [
      { nom: 'iPhone',      prix: '280 000', bg: 'bg-blue-500/20' },
      { nom: 'Airpods',     prix: '45 000',  bg: 'bg-sky-500/20' },
      { nom: 'Chargeur',    prix: '8 000',   bg: 'bg-cyan-500/20' },
    ],
  },
  {
    id:       '5',
    slug:     'sneakers-ci',
    nom:      'Sneakers CI',
    categorie: 'Chaussures',
    ville:    'Abidjan, Treichville',
    theme:    'stories-style',
    produits: 7,
    couleur:  '#8b5cf6',
    emoji:    '👟',
    badge:    true,
    produitsMockup: [
      { nom: 'Nike Air',    prix: '55 000', bg: 'bg-purple-500/20' },
      { nom: 'Adidas',      prix: '48 000', bg: 'bg-violet-500/20' },
      { nom: 'Jordan',      prix: '75 000', bg: 'bg-indigo-500/20' },
    ],
  },
  {
    id:       '6',
    slug:     'maison-deco-ci',
    nom:      'Maison & Déco CI',
    categorie: 'Maison & Déco',
    ville:    'Abidjan, Deux Plateaux',
    theme:    'vitrine-moderne',
    produits: 10,
    couleur:  '#10b981',
    emoji:    '🏠',
    badge:    false,
    produitsMockup: [
      { nom: 'Coussin',     prix: '12 000', bg: 'bg-emerald-500/20' },
      { nom: 'Lampe',       prix: '25 000', bg: 'bg-teal-500/20' },
      { nom: 'Tableau',     prix: '18 000', bg: 'bg-green-500/20' },
    ],
  },
];

// ─── Composant carte boutique ─────────────────────────────────────────────────

function CarteBoutique({ boutique }: { boutique: typeof BOUTIQUES[0] }) {
  return (
    <div className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">

      {/* Aperçu boutique */}
      <div className="p-4 bg-elevated">
        <div className="bg-bg rounded-xl p-3 space-y-2">

          {/* Header boutique miniature */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ backgroundColor: boutique.couleur + '20' }}
            >
              {boutique.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white text-xs font-semibold truncate">{boutique.nom}</p>
                {boutique.badge && (
                  <span className="text-primary text-xs">✓</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={8} className="text-muted" />
                <p className="text-muted text-xs truncate">{boutique.ville}</p>
              </div>
            </div>
          </div>

          {/* Mini grille produits */}
          <div className="grid grid-cols-3 gap-1.5">
            {boutique.produitsMockup.map((produit, i) => (
              <div key={i} className={`rounded-lg ${produit.bg} p-2 text-center`}>
                <p className="text-white text-xs truncate" style={{ fontSize: '9px' }}>{produit.nom}</p>
                <p className="font-bold" style={{ color: boutique.couleur, fontSize: '9px' }}>
                  {produit.prix} F
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Infos boutique */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-sm">{boutique.nom}</h3>
            <p className="text-muted text-xs">{boutique.categorie}</p>
          </div>
          {boutique.badge && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ backgroundColor: boutique.couleur + '20', color: boutique.couleur }}
            >
              ✓ Vérifié
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted text-xs">
            <ShoppingBag size={12} />
            <span>{boutique.produits} produits</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Boutiques() {
  return (
    <section id="boutiques" className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <span className="text-primary text-sm font-medium">🛍️ Boutiques du moment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Rejoignez des centaines de vendeurs
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Ces boutiques ont été créées avec ShopEasy CI. La vôtre pourrait être
            la prochaine à apparaître ici.
          </p>
        </div>

        {/* Grille boutiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOUTIQUES.map((boutique) => (
            <CarteBoutique key={boutique.id} boutique={boutique} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-muted">
            Les boutiques Premium apparaissent automatiquement sur cette vitrine.
          </p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
          >
            Créer ma boutique maintenant →
          </Link>
        </div>
      </div>
    </section>
  );
}