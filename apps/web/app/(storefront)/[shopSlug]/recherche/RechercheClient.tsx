'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image    from 'next/image';
import Link     from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, X, ChevronLeft, ChevronRight,
  Clock, TrendingUp, ShoppingBag,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

// ---------------------------------------------------------------------------
interface Props {
  shop:          ShopPublic;
  produits:      any[];
  queryInitiale: string;
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const HISTORIQUE_KEY = (slug: string) => `recherche_historique_${slug}`;
const MAX_HISTORIQUE = 5;

// ---------------------------------------------------------------------------
export default function RechercheClient({ shop, produits, queryInitiale }: Props) {
  const t      = getThemeConfig(shop.selectedTheme);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query,      setQuery]      = useState(queryInitiale);
  const [historique, setHistorique] = useState<string[]>([]);

  // -- Focus auto sur l'input --
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // -- Chargement historique --
  useEffect(() => {
    const data = localStorage.getItem(HISTORIQUE_KEY(shop.slug));
    if (data) setHistorique(JSON.parse(data));
  }, [shop.slug]);

  // -- Sauvegarde dans l'historique --
  const sauvegarderHistorique = (terme: string) => {
    if (!terme.trim()) return;
    const nouvel = [
      terme,
      ...historique.filter(h => h !== terme),
    ].slice(0, MAX_HISTORIQUE);
    setHistorique(nouvel);
    localStorage.setItem(HISTORIQUE_KEY(shop.slug), JSON.stringify(nouvel));
  };

  // -- Supprimer un terme de l'historique --
  const supprimerHistorique = (terme: string) => {
    const nouvel = historique.filter(h => h !== terme);
    setHistorique(nouvel);
    localStorage.setItem(HISTORIQUE_KEY(shop.slug), JSON.stringify(nouvel));
  };

  // -- Rechercher --
  const rechercher = (terme: string) => {
    if (!terme.trim()) return;
    sauvegarderHistorique(terme.trim());
    setQuery(terme.trim());
    router.replace(` /recherche?q=${encodeURIComponent(terme.trim())}`);
  };

  // -- Résultats filtrés --
  const resultats = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return produits.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [produits, query]);

  // -- Suggestions (produits populaires si pas de query) --
  const suggestions = useMemo(() =>
    produits.slice(0, 6),
    [produits]
  );

  // ---------------------------------------------------------------------------
  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── BARRE DE RECHERCHE STICKY ── */}
      <div
        className="sticky top-0 z-40 px-4 py-3 space-y-0"
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">

          {/* Retour */}
          <Link
             href="/"
            className="p-2 rounded-xl flex-shrink-0"
            style={{ backgroundColor: t.elevated }}
          >
            <ChevronLeft size={18} style={{ color: t.text }} />
          </Link>

          {/* Input */}
          <div
            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border"
            style={{ backgroundColor: t.elevated, borderColor: t.border }}
          >
            <Search size={16} style={{ color: t.muted }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && rechercher(query)}
              placeholder={`Rechercher dans ${shop.name}...`}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: t.text }}
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={14} style={{ color: t.muted }} />
              </button>
            )}
          </div>

          {/* Bouton recherche */}
          <button
            onClick={() => rechercher(query)}
            disabled={!query.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold
                       transition-colors disabled:opacity-40 flex-shrink-0"
            style={{ backgroundColor: t.accent, color: '#fff' }}
          >
            OK
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── ÉTAT VIDE — pas encore de recherche ── */}
        {!query && (
          <div className="space-y-6">

            {/* Historique */}
            {historique.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2"
                    style={{ color: t.muted }}>
                  <Clock size={14} />
                  Recherches récentes
                </h2>
                <div className="space-y-1">
                  {historique.map(terme => (
                    <div
                      key={terme}
                      className="flex items-center justify-between px-4 py-3
                                 rounded-xl cursor-pointer transition-colors"
                      style={{ backgroundColor: t.surface }}
                      onClick={() => rechercher(terme)}
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={14} style={{ color: t.muted }} />
                        <span className="text-sm" style={{ color: t.text }}>
                          {terme}
                        </span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          supprimerHistorique(terme);
                        }}
                        className="p-1"
                      >
                        <X size={12} style={{ color: t.muted }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions populaires */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2"
                  style={{ color: t.muted }}>
                <TrendingUp size={14} />
                Produits populaires
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map(p => (
                  <Link
                    key={p._id}
                    href={` /produits/${p._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border
                               transition-all hover:border-opacity-50"
                    style={{ backgroundColor: t.surface, borderColor: t.border }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg overflow-hidden
                                 flex-shrink-0 relative"
                      style={{ backgroundColor: t.elevated }}
                    >
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} fill
                                 className="object-cover" />
                        : <div className="w-full h-full flex items-center
                                          justify-center text-xl"></div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate"
                         style={{ color: t.text }}>
                        {p.name}
                      </p>
                      <p className="text-xs font-bold" style={{ color: t.accent }}>
                        {formatFcfa(p.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RÉSULTATS ── */}
        {query && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: t.muted }}>
              {resultats.length > 0
                ? `${resultats.length} résultat${resultats.length > 1 ? 's' : ''} pour "${query}"`
                : `Aucun résultat pour "${query}"`
              }
            </p>

            {resultats.length === 0 ? (
              <div className="flex flex-col items-center justify-center
                              py-16 space-y-4 text-center">
                <ShoppingBag size={48} style={{ color: t.muted }} />
                <div>
                  <p className="font-semibold" style={{ color: t.text }}>
                    Aucun produit trouvé
                  </p>
                  <p className="text-sm mt-1" style={{ color: t.muted }}>
                    Essaie avec d'autres mots-clés
                  </p>
                </div>
                <Link
                  href={"/catalogue"}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: t.accent, color: '#fff' }}
                >
                  Voir tout le catalogue
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {resultats.map(p => (
                  <Link
                    key={p._id}
                    href={` /produits/${p._id}`}
                    className="flex gap-4 p-4 rounded-2xl border transition-all
                               hover:border-opacity-60"
                    style={{ backgroundColor: t.surface, borderColor: t.border }}
                  >
                    {/* Image */}
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden
                                 flex-shrink-0 relative"
                      style={{ backgroundColor: t.elevated }}
                    >
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} fill
                                 className="object-cover" />
                        : <div className="w-full h-full flex items-center
                                          justify-center text-2xl"></div>
                      }
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Highlight du terme recherché */}
                      <p className="font-semibold text-sm"
                         style={{ color: t.text }}
                         dangerouslySetInnerHTML={{
                           __html: p.name.replace(
                             new RegExp(`(${query})`, 'gi'),
                             `<mark style="background:${t.accent}30;color:${t.accent};border-radius:3px;padding:0 2px">$1</mark>`
                           ),
                         }}
                      />
                      {p.description && (
                        <p className="text-xs line-clamp-2"
                           style={{ color: t.muted }}>
                          {p.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm"
                              style={{ color: t.accent }}>
                          {formatFcfa(p.price)}
                        </span>
                        {p.comparePrice > p.price && (
                          <span className="text-xs line-through"
                                style={{ color: t.muted }}>
                            {formatFcfa(p.comparePrice)}
                          </span>
                        )}
                        {p.totalStock === 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: t.elevated, color: t.muted }}
                          >
                            Rupture
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={16} className="self-center flex-shrink-0"
                                  style={{ color: t.muted }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}