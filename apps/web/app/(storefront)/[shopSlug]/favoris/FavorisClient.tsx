'use client';

import { useState, useEffect } from 'react';
import Image   from 'next/image';
import Link    from 'next/link';
import { Heart, ShoppingCart, Trash2, ChevronLeft } from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

interface FavoriItem {
  _id:   string;
  nom:   string;
  prix:  number;
  image: string | null;
}

interface Props { shop: ShopPublic; }

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function FavorisClient({ shop }: Props) {
  const t   = getThemeConfig(shop.selectedTheme);
  const cle = `favoris_${shop.slug}`;

  const [favoris, setFavoris] = useState<FavoriItem[]>([]);

  useEffect(() => {
    const charger = () => {
      const data = localStorage.getItem(cle);
      setFavoris(data ? JSON.parse(data) : []);
    };
    charger();
    window.addEventListener('favoris-updated', charger);
    return () => window.removeEventListener('favoris-updated', charger);
  }, [cle]);

  const supprimer = (id: string) => {
    const nouvelle = favoris.filter(f => f._id !== id);
    localStorage.setItem(cle, JSON.stringify(nouvelle));
    setFavoris(nouvelle);
  };

  const vider = () => {
    localStorage.removeItem(cle);
    setFavoris([]);
  };

  const ajouterAuPanier = (favori: FavoriItem) => {
    const panier   = JSON.parse(localStorage.getItem(`panier_${shop.slug}`) ?? '[]');
    const cle2     = `${favori._id}_{}`;
    const existant = panier.find((i: any) => i.cle === cle2);
    if (existant) {
      existant.quantite += 1;
    } else {
      panier.push({
        cle:       cle2,
        produitId: favori._id,
        nom:       favori.nom,
        prix:      favori.prix,
        image:     favori.image,
        variantes: {},
        quantite:  1,
      });
    }
    localStorage.setItem(`panier_${shop.slug}`, JSON.stringify(panier));
    window.dispatchEvent(new Event('panier-updated'));
  };

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
           className="sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={` /catalogue`}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}>
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Catalogue</span>
          </Link>
          {favoris.length > 0 && (
            <button onClick={vider} className="text-xs hover:underline" style={{ color: t.muted }}>
              Tout supprimer
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* En-tete */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: t.text }}>
            <Heart size={22} style={{ color: t.accent }} fill={t.accent} />
            Mes favoris
          </h1>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {favoris.length} produit{favoris.length > 1 ? 's' : ''} sauvegarde{favoris.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Vide */}
        {favoris.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Heart size={56} style={{ color: t.muted }} />
            <p className="font-semibold text-lg" style={{ color: t.text }}>
              Aucun favori pour l'instant
            </p>
            <p className="text-sm" style={{ color: t.muted }}>
              Clique sur ❤️ sur un produit pour le sauvegarder
            </p>
            <Link href={` /catalogue`}
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ backgroundColor: t.accent, color: '#fff' }}>
              Voir le catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favoris.map(favori => (
              <div key={favori._id}
                className="flex gap-3 p-3 rounded-2xl border"
                style={{ backgroundColor: t.surface, borderColor: t.border }}>

                {/* Image */}
                <Link href={` /produits/${favori._id}`}
                  className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative"
                  style={{ backgroundColor: t.elevated }}>
                  {favori.image
                    ? <Image src={favori.image} alt={favori.nom} fill className="object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl"></div>
                  }
                </Link>

                {/* Infos */}
                <div className="flex-1 min-w-0 space-y-1">
                  <Link href={` /produits/${favori._id}`}>
                    <p className="font-semibold text-sm truncate hover:opacity-70" style={{ color: t.text }}>
                      {favori.nom}
                    </p>
                  </Link>
                  <p className="font-bold text-sm" style={{ color: t.accent }}>
                    {formatFcfa(favori.prix)}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => ajouterAuPanier(favori)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                      style={{ backgroundColor: t.accent, color: '#fff' }}>
                      <ShoppingCart size={12} />
                      Ajouter au panier
                    </button>
                    <button onClick={() => supprimer(favori._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}