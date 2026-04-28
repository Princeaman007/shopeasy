'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Store, BadgeCheck, ArrowLeft, Loader2, MapPin } from 'lucide-react';

interface Boutique {
  _id:           string;
  slug:          string;
  name:          string;
  isVerified:    boolean;
  selectedTheme: string;
  heroImage?:    string;
  logo?:         string;
  about?: {
    description?: string;
    location?:    string;
  };
  produits: {
    _id:    string;
    name:   string;
    price:  number;
    images: string[];
  }[];
}

interface Pagination {
  page:    number;
  total:   number;
  pages:   number;
  parPage: number;
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function BoutiquesPage() {
  const [boutiques,      setBoutiques]      = useState<Boutique[]>([]);
  const [pagination,     setPagination]     = useState<Pagination | null>(null);
  const [recherche,      setRecherche]      = useState('');
  const [page,           setPage]           = useState(1);
  const [chargement,     setChargement]     = useState(true);
  const [chargementPlus, setChargementPlus] = useState(false);

  const fetchBoutiques = useCallback(async (q: string, p: number, append = false) => {
    append ? setChargementPlus(true) : setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set('q', q.trim());
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/annuaire?${params}`);
      const data = await res.json();
      setBoutiques(prev => append ? [...prev, ...(data.boutiques || [])] : (data.boutiques || []));
      setPagination(data.pagination || null);
    } catch {
      setBoutiques([]);
    } finally {
      append ? setChargementPlus(false) : setChargement(false);
    }
  }, []);

  useEffect(() => { fetchBoutiques('', 1); }, [fetchBoutiques]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchBoutiques(recherche, 1); }, 400);
    return () => clearTimeout(timer);
  }, [recherche, fetchBoutiques]);

  const chargerPlus = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBoutiques(recherche, nextPage, true);
  };

  return (
    <div className="min-h-screen bg-bg">

      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <BadgeCheck size={13} /> Boutiques Premium verifiees
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Decouvrez nos boutiques</h1>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Les meilleures boutiques ivoiriennes, toutes verifiees et pretes a vous livrer
            </p>
          </div>
          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une boutique..."
              className="w-full bg-elevated border border-border rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm" />
            {recherche && (
              <button onClick={() => setRecherche('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                x
              </button>
            )}
          </div>
          {pagination && !chargement && (
            <p className="text-center text-muted text-sm mt-4">
              {pagination.total} boutique{pagination.total !== 1 ? 's' : ''} trouvee{pagination.total !== 1 ? 's' : ''}
              {recherche && ` pour "${recherche}"`}
            </p>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {chargement && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        )}

        {!chargement && boutiques.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Store size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucune boutique trouvee</h2>
            <p className="text-muted text-sm">
              {recherche ? `Aucun resultat pour "${recherche}"` : 'Aucune boutique premium disponible'}
            </p>
          </div>
        )}

        {!chargement && boutiques.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {boutiques.map((boutique) => (
                <Link key={boutique._id} href={`https://${boutique.slug}.shopeasyci.store`}
                  className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">

                  {/* Hero */}
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
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
                        <Image src={boutique.logo} alt={boutique.name} width={40} height={40}
                          className="rounded-xl object-cover border-2 border-white/20 shadow-lg" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg border-2 border-white/20">
                          <span className="text-black font-bold text-lg">
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

                  {/* Description */}
                  {boutique.about?.description && (
                    <div className="px-4 pt-3">
                      <p className="text-muted text-xs line-clamp-2">{boutique.about.description}</p>
                    </div>
                  )}

                  {/* Apercu produits */}
                  {boutique.produits?.length > 0 && (
                    <div className="p-4 space-y-2">
                      <p className="text-muted text-xs font-medium uppercase tracking-wide">Quelques produits</p>
                      <div className="grid grid-cols-3 gap-2">
                        {boutique.produits.map((produit) => (
                          <div key={produit._id}
                            className="aspect-square rounded-xl overflow-hidden bg-elevated border border-border relative">
                            {produit.images?.[0] ? (
                              <Image src={produit.images[0]} alt={produit.name} fill
                                className="object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">...</div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-1">
                              <p className="text-primary text-xs font-bold truncate">{formatFcfa(produit.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer carte */}
                  <div className="px-4 pb-4 flex items-center justify-between">
                    <span className="text-muted text-xs">
                      {boutique.produits?.length > 0 ? `${boutique.produits.length}+ produits` : 'Boutique premium'}
                    </span>
                    <span className="text-primary text-xs font-semibold group-hover:underline">
                      Visiter la boutique
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {pagination && page < pagination.pages && (
              <div className="text-center mt-10">
                <button onClick={chargerPlus} disabled={chargementPlus}
                  className="inline-flex items-center gap-2 bg-surface hover:bg-elevated border border-border hover:border-primary/40 text-white font-semibold px-6 py-3 rounded-2xl transition-all disabled:opacity-50">
                  {chargementPlus ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
                  {chargementPlus ? 'Chargement...' : 'Voir plus de boutiques'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}