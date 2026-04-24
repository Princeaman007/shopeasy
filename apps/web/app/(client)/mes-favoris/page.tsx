'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { Heart, ArrowLeft, ShoppingBag, Trash2, ShoppingCart } from 'lucide-react';

interface FavoriItem {
  _id:   string;
  nom:   string;
  prix:  number;
  image: string | null;
  shopSlug?: string;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function MesFavorisPage() {
  const [favoris,    setFavoris]    = useState<FavoriItem[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    // Recupere tous les favoris de toutes les boutiques
    const tous: FavoriItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle?.startsWith('favoris_')) {
        const slug = cle.replace('favoris_', '');
        const data = localStorage.getItem(cle);
        if (data) {
          const liste = JSON.parse(data);
          liste.forEach((f: FavoriItem) => {
            tous.push({ ...f, shopSlug: slug });
          });
        }
      }
    }
    setFavoris(tous);
    setChargement(false);

    const handler = () => {
      const mis: FavoriItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const cle = localStorage.key(i);
        if (cle?.startsWith('favoris_')) {
          const slug = cle.replace('favoris_', '');
          const data = localStorage.getItem(cle);
          if (data) {
            const liste = JSON.parse(data);
            liste.forEach((f: FavoriItem) => mis.push({ ...f, shopSlug: slug }));
          }
        }
      }
      setFavoris(mis);
    };
    window.addEventListener('favoris-updated', handler);
    return () => window.removeEventListener('favoris-updated', handler);
  }, []);

  const supprimer = (id: string, shopSlug: string) => {
    const cle   = `favoris_${shopSlug}`;
    const data  = localStorage.getItem(cle);
    const liste = data ? JSON.parse(data) : [];
    const nouvelle = liste.filter((f: FavoriItem) => f._id !== id);
    localStorage.setItem(cle, JSON.stringify(nouvelle));
    setFavoris(prev => prev.filter(f => !(f._id === id && f.shopSlug === shopSlug)));
    window.dispatchEvent(new Event('favoris-updated'));
  };

  const ajouterAuPanier = (favori: FavoriItem) => {
    if (!favori.shopSlug) return;
    const cle2     = `panier_${favori.shopSlug}`;
    const panier   = JSON.parse(localStorage.getItem(cle2) ?? '[]');
    const cleItem  = `${favori._id}_{}`;
    const existant = panier.find((i: any) => i.cle === cleItem);
    if (existant) {
      existant.quantite += 1;
    } else {
      panier.push({
        cle:       cleItem,
        produitId: favori._id,
        nom:       favori.nom,
        prix:      favori.prix,
        image:     favori.image,
        variantes: {},
        quantite:  1,
      });
    }
    localStorage.setItem(cle2, JSON.stringify(panier));
    window.dispatchEvent(new Event('panier-updated'));
  };

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
              <Heart size={20} className="text-primary" fill="#06C167" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mes favoris</h1>
              <p className="text-muted text-sm">
                {favoris.length} produit{favoris.length !== 1 ? 's' : ''} sauvegarde{favoris.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Vide */}
        {favoris.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucun favori</h2>
            <p className="text-muted text-sm mb-6">
              Clique sur ❤️ sur un produit pour le sauvegarder ici
            </p>
            <Link href="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Decouvrir les boutiques
            </Link>
          </div>
        )}

        {/* Grille favoris */}
        {favoris.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {favoris.map((produit) => (
              <div key={`${produit._id}_${produit.shopSlug}`}
                className="bg-surface border border-border rounded-2xl overflow-hidden group">

                {/* Image */}
                <div className="relative aspect-square">
                  {produit.image ? (
                    <Image src={produit.image} alt={produit.nom} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-elevated flex items-center justify-center">
                      <ShoppingBag size={28} className="text-muted" />
                    </div>
                  )}
                  {/* Bouton retirer */}
                  <button
                    onClick={() => supprimer(produit._id, produit.shopSlug!)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/60 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Infos */}
                <div className="p-3 space-y-2">
                  <Link href={`/${produit.shopSlug}/produits/${produit._id}`}
                    className="text-white text-sm font-medium hover:text-primary transition-colors line-clamp-2 block">
                    {produit.nom}
                  </Link>
                  <p className="text-primary font-bold text-sm">{fmt(produit.prix)}</p>
                  <button
                    onClick={() => ajouterAuPanier(produit)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#06C167', color: '#000' }}>
                    <ShoppingCart size={12} />
                    Ajouter au panier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}