'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowLeft, Store, BadgeCheck, ShoppingBag, MapPin } from 'lucide-react';
import BottomNavBar from '@/components/client/BottomNavBar';
import ClientNavbar from '@/components/client/ClientNavbar';

interface Boutique {
  _id:        string;
  slug:       string;
  name:       string;
  isVerified: boolean;
  heroImage?: string;
  logo?:      string;
  about?: { description?: string; location?: string };
}

interface Produit {
  _id:      string;
  name:     string;
  price:    number;
  images:   string[];
  boutique: { slug: string; name: string } | null;
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

function SkeletonLigne() {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-2xl animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-elevated flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-elevated rounded-full w-2/3" />
        <div className="h-3 bg-elevated rounded-full w-1/3" />
      </div>
    </div>
  );
}

export default function RecherchePage() {
  const [recherche,  setRecherche]  = useState('');
  const [boutiques,  setBoutiques]  = useState<Boutique[]>([]);
  const [produits,   setProduits]   = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(false);
  const [aRecherche, setARecherche] = useState(false);

  const rechercher = useCallback(async (q: string) => {
    if (!q.trim()) {
      setBoutiques([]);
      setProduits([]);
      setARecherche(false);
      return;
    }
    setChargement(true);
    setARecherche(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/recherche-globale?${params}`);
      const data = await res.json();
      setBoutiques(data.boutiques || []);
      setProduits(data.produits || []);
    } catch {
      setBoutiques([]);
      setProduits([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => rechercher(recherche), 400);
    return () => clearTimeout(timer);
  }, [recherche, rechercher]);

  const aucunResultat = aRecherche && !chargement && boutiques.length === 0 && produits.length === 0;

  return (
    <div className="min-h-screen bg-bg pb-20 md:pb-0">

      <ClientNavbar />

      {/* Header */}
      <div className="border-b border-border bg-surface sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <Link href="/boutiques"
            className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Boutiques
          </Link>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit ou une boutique..."
              className="w-full bg-elevated border border-border rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
            />
            {recherche && (
              <button onClick={() => setRecherche('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors text-lg">
                x
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Etat initial */}
        {!aRecherche && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Que recherchez-vous ?</h2>
            <p className="text-muted text-sm">
              Un produit precis ou une boutique — tapez pour commencer
            </p>
          </div>
        )}

        {/* Chargement */}
        {chargement && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonLigne key={i} />)}
          </div>
        )}

        {/* Aucun resultat */}
        {aucunResultat && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Store size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucun resultat</h2>
            <p className="text-muted text-sm">
              Rien ne correspond a "{recherche}"
            </p>
          </div>
        )}

        {/* ── RESULTATS PRODUITS ── */}
        {!chargement && produits.length > 0 && (
          <div className="space-y-3">
            <p className="text-muted text-xs font-medium uppercase tracking-wide">
              Produits ({produits.length})
            </p>
            <div className="space-y-2">
              {produits.map((produit) => (
                <Link key={produit._id}
                  href={produit.boutique ? `https://${produit.boutique.slug}.shopeasyci.store/produits/${produit._id}?ref=vitrine` : '#'}
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-2xl hover:border-primary/40 transition-colors">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-elevated flex-shrink-0 relative">
                    {produit.images?.[0] ? (
                      <Image src={produit.images[0]} alt={produit.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={18} className="text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{produit.name}</p>
                    {produit.boutique && (
                      <p className="text-muted text-xs truncate">{produit.boutique.name}</p>
                    )}
                  </div>
                  <p className="text-primary font-bold text-sm flex-shrink-0">
                    {formatFcfa(produit.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTATS BOUTIQUES ── */}
        {!chargement && boutiques.length > 0 && (
          <div className="space-y-3">
            <p className="text-muted text-xs font-medium uppercase tracking-wide">
              Boutiques ({boutiques.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boutiques.map((boutique) => (
                <Link key={boutique._id} href={`https://${boutique.slug}.shopeasyci.store`}
                  className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all">

                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    {boutique.heroImage ? (
                      <Image src={boutique.heroImage} alt={boutique.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-elevated" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {boutique.isVerified && (
                      <div className="absolute top-3 right-3 bg-primary rounded-lg px-2 py-1 flex items-center gap-1">
                        <BadgeCheck size={12} className="text-black" />
                        <span className="text-black text-xs font-bold">Verifie</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      {boutique.logo ? (
                        <Image src={boutique.logo} alt={boutique.name} width={36} height={36}
                          className="rounded-xl object-cover border-2 border-white/20" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center border-2 border-white/20">
                          <span className="text-black font-bold">
                            {boutique.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold text-sm drop-shadow-lg">{boutique.name}</p>
                        {boutique.about?.location && (
                          <p className="text-white/70 text-xs flex items-center gap-1">
                            <MapPin size={10} /> {boutique.about.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  );
}