'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, CheckCircle, Crown, Zap, Clock,
  ChevronRight, Loader2, RefreshCw, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
interface Boutique {
  _id:                   string;
  name:                  string;
  slug:                  string;
  planType:              'basic' | 'premium';
  subscriptionStatus:    'trial' | 'active' | 'expired' | 'suspended';
  subscriptionExpiresAt: string | null;
  trialEndsAt:           string | null;
  isVerified:            boolean;
  createdAt:             string;
  ownerId: {
    _id:   string;
    name:  string;
    email: string;
    phone: string;
  };
}

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const STATUTS = {
  trial:     { label: 'Essai',    classe: 'bg-blue-500/10 text-blue-400 border-blue-500/30'      },
  active:    { label: 'Actif',    classe: 'bg-primary/10 text-primary border-primary/30'          },
  expired:   { label: 'Expiré',   classe: 'bg-red-500/10 text-red-400 border-red-500/30'          },
  suspended: { label: 'Suspendu', classe: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// -- Helper fetch avec credentials --
const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
};

// ---------------------------------------------------------------------------
export default function PageMarchands() {
  const [boutiques,    setBoutiques]    = useState<Boutique[]>([]);
  const [chargement,   setChargement]   = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtrePlan,   setFiltrePlan]   = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [actionId,     setActionId]     = useState<string | null>(null);

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '15',
        ...(recherche    && { search: recherche    }),
        ...(filtreStatut && { status: filtreStatut }),
        ...(filtrePlan   && { plan:   filtrePlan   }),
      });

      const res  = await authFetch(`${API}/admin/shops?${params}`);
      const data = await res.json();

      if (data.success) {
        setBoutiques(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [page, filtreStatut, filtrePlan]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); charger(); }, 400);
    return () => clearTimeout(timer);
  }, [recherche]);

  // -- Vérifier boutique --
  const verifier = async (id: string) => {
    setActionId(id);
    try {
      await authFetch(`${API}/admin/shops/${id}/verify`, { method: 'PATCH' });
      charger();
    } finally {
      setActionId(null);
    }
  };

  // -- Modifier abonnement --
  const modifierAbonnement = async (id: string, status: string, planType?: string) => {
    setActionId(id);
    try {
      await authFetch(`${API}/admin/shops/${id}/subscription`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status, ...(planType && { planType }) }),
      });
      charger();
    } finally {
      setActionId(null);
    }
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Marchands</h1>
          <p className="text-muted text-sm mt-1">
            {total} boutique{total > 1 ? 's' : ''} enregistrée{total > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={charger}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border
                     border-border text-muted hover:text-white transition-colors text-sm"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60 flex items-center gap-2 px-4 py-2.5
                        bg-surface border border-border rounded-xl">
          <Search size={16} className="text-muted" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher une boutique ou un marchand..."
            className="flex-1 bg-transparent outline-none text-sm text-white
                       placeholder-muted"
          />
          {recherche && (
            <button onClick={() => setRecherche('')}>
              <X size={14} className="text-muted hover:text-white" />
            </button>
          )}
        </div>

        <select
          value={filtreStatut}
          onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl
                     text-sm text-white outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="trial">Essai</option>
          <option value="active">Actif</option>
          <option value="expired">Expiré</option>
          <option value="suspended">Suspendu</option>
        </select>

        <select
          value={filtrePlan}
          onChange={e => { setFiltrePlan(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl
                     text-sm text-white outline-none"
        >
          <option value="">Tous les plans</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {chargement ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : boutiques.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p>Aucune boutique trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Boutique', 'Marchand', 'Plan', 'Statut', 'Créée le', 'Actions'].map(h => (
                    <th key={h}
                        className="text-left px-5 py-3.5 text-xs font-semibold
                                   text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {boutiques.map(b => {
                  const statut  = STATUTS[b.subscriptionStatus];
                  const loading = actionId === b._id;

                  return (
                    <tr key={b._id}
                        className="hover:bg-elevated/50 transition-colors">

                      {/* Boutique */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white text-sm font-medium">
                            {b.name}
                          </p>
                          {b.isVerified && (
                            <CheckCircle size={13} className="text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-muted text-xs">{b.slug}</p>
                      </td>

                      {/* Marchand */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{b.ownerId?.name}</p>
                        <p className="text-muted text-xs">{b.ownerId?.email}</p>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {b.planType === 'premium'
                            ? <Crown size={13} className="text-amber-400" />
                            : <Zap   size={13} className="text-primary"  />
                          }
                          <span className={`text-xs font-semibold capitalize
                                          ${b.planType === 'premium'
                                            ? 'text-amber-400' : 'text-primary'}`}>
                            {b.planType}
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1
                                         rounded-full border ${statut.classe}`}>
                          {statut.label}
                        </span>
                        {(b.subscriptionExpiresAt || b.trialEndsAt) && (
                          <p className="text-muted text-xs mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(b.subscriptionExpiresAt ?? b.trialEndsAt ?? '')}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-muted text-sm">{formatDate(b.createdAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/marchands/${b._id}`}
                            className="p-1.5 rounded-lg text-muted hover:text-white
                                       hover:bg-elevated transition-colors"
                            title="Voir le détail"
                          >
                            <ChevronRight size={15} />
                          </Link>

                          {!b.isVerified && (
                            <button
                              onClick={() => verifier(b._id)}
                              disabled={loading}
                              title="Vérifier la boutique"
                              className="p-1.5 rounded-lg text-muted hover:text-primary
                                         hover:bg-primary/10 transition-colors
                                         disabled:opacity-50"
                            >
                              {loading
                                ? <Loader2 size={15} className="animate-spin" />
                                : <CheckCircle size={15} />
                              }
                            </button>
                          )}

                          {b.subscriptionStatus !== 'active' && (
                            <button
                              onClick={() => modifierAbonnement(b._id, 'active')}
                              disabled={loading}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                         bg-primary/10 text-primary hover:bg-primary/20
                                         transition-colors disabled:opacity-50"
                            >
                              Activer
                            </button>
                          )}

                          {b.subscriptionStatus === 'active' && (
                            <button
                              onClick={() => modifierAbonnement(b._id, 'suspended')}
                              disabled={loading}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                         bg-red-500/10 text-red-400 hover:bg-red-500/20
                                         transition-colors disabled:opacity-50"
                            >
                              Suspendre
                            </button>
                          )}

                          {b.planType === 'basic' && (
                            <button
                              onClick={() => modifierAbonnement(b._id, 'active', 'premium')}
                              disabled={loading}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                         bg-amber-500/10 text-amber-400
                                         hover:bg-amber-500/20 transition-colors
                                         disabled:opacity-50"
                            >
                              → Premium
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted
                       hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Précédent
          </button>
          <span className="text-muted text-sm">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted
                       hover:text-white disabled:opacity-30 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}