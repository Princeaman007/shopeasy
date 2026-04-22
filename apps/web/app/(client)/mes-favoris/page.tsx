'use client';

import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { useClientFavorites } from '@/hooks/useClientFavorites';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function MesFavorisPage() {
  const { favoris, chargement, erreur, retirerFavori } = useClientFavorites();

  if (chargement) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Heart size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mes favoris</h1>
              <p className="text-muted text-sm">{favoris.length} produit{favoris.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Erreur */}
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">{erreur}</div>
        )}

        {/* Vide */}
        {!erreur && favoris.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucun favori</h2>
            <p className="text-muted text-sm mb-6">
              Ajoutez des produits à vos favoris pour les retrouver facilement
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Découvrir les boutiques
            </Link>
          </div>
        )}

        {/* Grille favoris */}
        {favoris.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {favoris.map((produit) => (
              <div key={produit._id} className="bg-surface border border-border rounded-2xl overflow-hidden group">
                {/* Image */}
                <div className="relative aspect-square">
                  {produit.images[0] ? (
                    <img
                      src={produit.images[0]}
                      alt={produit.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-elevated flex items-center justify-center">
                      <ShoppingBag size={28} className="text-muted" />
                    </div>
                  )}

                  {/* Badge rupture */}
                  {produit.status === 'out_of_stock' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-black/80 px-2 py-1 rounded-lg">
                        Rupture de stock
                      </span>
                    </div>
                  )}

                  {/* Bouton retirer */}
                  <button
                    onClick={() => retirerFavori(produit._id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/60 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="Retirer des favoris"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Infos */}
                <div className="p-3">
                  <p className="text-muted text-xs mb-1 truncate">
                    {produit.shopId?.name}
                  </p>
                  <Link
                    href={`/${produit.shopId?.slug}/produits/${produit._id}`}
                    className="text-white text-sm font-medium hover:text-primary transition-colors line-clamp-2 block"
                  >
                    {produit.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-primary font-bold text-sm">{fmt(produit.price)}</span>
                    {produit.comparePrice && produit.comparePrice > produit.price && (
                      <span className="text-muted text-xs line-through">{fmt(produit.comparePrice)}</span>
                    )}
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