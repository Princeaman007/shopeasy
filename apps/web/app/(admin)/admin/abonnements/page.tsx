'use client';

import { useState, useEffect } from 'react';
import {
  Crown, Zap, Clock, Loader2, RefreshCw,
  Search, X, AlertTriangle, CreditCard,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

const joursRestants = (date: string): number => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

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
    name:  string;
    email: string;
    phone: string;
  };
}

// ---------------------------------------------------------------------------
export default function PageAbonnementsAdmin() {
  const [boutiques,    setBoutiques]    = useState<Boutique[]>([]);
  const [chargement,   setChargement]   = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtrePlan,   setFiltrePlan]   = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [stats,        setStats]        = useState<any>(null);

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '15',
        ...(filtreStatut && { status: filtreStatut }),
        ...(filtrePlan   && { plan:   filtrePlan   }),
        ...(recherche    && { search: recherche    }),
      });

      const [shopsRes, statsRes] = await Promise.all([
        authFetch(`${API}/admin/shops?${params}`),
        authFetch(`${API}/admin/stats`),
      ]);

      const shopsData = await shopsRes.json();
      const statsData = await statsRes.json();

      if (shopsData.success) {
        setBoutiques(shopsData.data);
        setTotalPages(shopsData.pagination.totalPages);
        setTotal(shopsData.pagination.total);
      }
      if (statsData.success) setStats(statsData.data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [page, filtreStatut, filtrePlan]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); charger(); }, 400);
    return () => clearTimeout(timer);
  }, [recherche]);

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
      <div>
        <h1 className="text-white text-2xl font-bold">Abonnements</h1>
        <p className="text-muted text-sm mt-1">
          Gestion des plans et renouvellements
        </p>
      </div>

      {/* ── KPIs ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">MRR</span>
              <CreditCard size={16} className="text-primary" />
            </div>
            <p className="text-white text-xl font-bold">{formatFcfa(stats.mrr)}</p>
            <p className="text-muted text-xs">Revenus mensuels récurrents</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">Premium</span>
              <Crown size={16} className="text-amber-400" />
            </div>
            <p className="text-white text-xl font-bold">
              {stats.abonnements?.premium_count ?? 0}
            </p>
            <p className="text-muted text-xs">
              {formatFcfa((stats.abonnements?.premium_count ?? 0) * 30000)}/mois
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">Basic</span>
              <Zap size={16} className="text-primary" />
            </div>
            <p className="text-white text-xl font-bold">
              {stats.abonnements?.basic_count ?? 0}
            </p>
            <p className="text-muted text-xs">
              {formatFcfa((stats.abonnements?.basic_count ?? 0) * 15000)}/mois
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">Expirés</span>
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <p className="text-white text-xl font-bold text-red-400">
              {stats.abonnements?.expires_count ?? 0}
            </p>
            <p className="text-muted text-xs">À renouveler</p>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60 flex items-center gap-2 px-4 py-2.5
                        bg-surface border border-border rounded-xl">
          <Search size={16} className="text-muted" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher une boutique..."
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

        <button
          onClick={charger}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border
                     border-border text-muted hover:text-white text-sm transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {chargement ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : boutiques.length === 0 ? (
          <div className="text-center py-16 text-muted">
            Aucun abonnement trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Boutique', 'Marchand', 'Plan', 'Statut',
                    'Expiration', 'Jours restants', 'Actions'].map(h => (
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
                  const loading   = actionId === b._id;
                  const dateRef   = b.subscriptionExpiresAt ?? b.trialEndsAt;
                  const jours     = dateRef ? joursRestants(dateRef) : null;
                  const urgence   = jours !== null && jours <= 3;
                  const attention = jours !== null && jours <= 7 && jours > 3;

                  return (
                    <tr key={b._id}
                        className={`hover:bg-elevated/50 transition-colors
                                   ${b.subscriptionStatus === 'expired'
                                     ? 'bg-red-500/5' : ''}`}>

                      {/* Boutique */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-medium">{b.name}</p>
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
                                         rounded-full border
                                         ${b.subscriptionStatus === 'active'
                                           ? 'bg-primary/10 text-primary border-primary/30'
                                           : b.subscriptionStatus === 'trial'
                                             ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                             : b.subscriptionStatus === 'expired'
                                               ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                               : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                                         }`}>
                          {b.subscriptionStatus === 'active'  ? 'Actif'    :
                           b.subscriptionStatus === 'trial'   ? 'Essai'    :
                           b.subscriptionStatus === 'expired' ? 'Expiré'   :
                           'Suspendu'}
                        </span>
                      </td>

                      {/* Expiration */}
                      <td className="px-5 py-4">
                        {dateRef
                          ? <p className={`text-sm ${urgence ? 'text-red-400' : 'text-muted'}`}>
                              {formatDate(dateRef)}
                            </p>
                          : <p className="text-muted text-sm">—</p>
                        }
                      </td>

                      {/* Jours restants */}
                      <td className="px-5 py-4">
                        {jours !== null ? (
                          <div className="flex items-center gap-1.5">
                            {urgence   && <AlertTriangle size={13} className="text-red-400"   />}
                            {attention && <Clock         size={13} className="text-amber-400" />}
                            <span className={`text-sm font-semibold
                                            ${urgence   ? 'text-red-400'   :
                                              attention  ? 'text-amber-400' :
                                              'text-white'}`}>
                              {jours}j
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted text-sm">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {loading ? (
                            <Loader2 size={15} className="animate-spin text-muted" />
                          ) : (
                            <>
                              {b.subscriptionStatus !== 'active' && (
                                <button
                                  onClick={() => modifierAbonnement(b._id, 'active')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                             bg-primary/10 text-primary hover:bg-primary/20
                                             transition-colors"
                                >
                                  Activer
                                </button>
                              )}

                              {b.subscriptionStatus === 'active' && (
                                <button
                                  onClick={() => modifierAbonnement(b._id, 'active')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                             bg-elevated text-muted hover:text-white
                                             border border-border transition-colors"
                                >
                                  +30j
                                </button>
                              )}

                              {b.planType === 'basic' && (
                                <button
                                  onClick={() => modifierAbonnement(b._id, 'active', 'premium')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                             bg-amber-500/10 text-amber-400
                                             hover:bg-amber-500/20 transition-colors"
                                >
                                  Premium
                                </button>
                              )}

                              {b.planType === 'premium' && (
                                <button
                                  onClick={() => modifierAbonnement(b._id, 'active', 'basic')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                             bg-elevated text-muted hover:text-white
                                             border border-border transition-colors"
                                >
                                  Basic
                                </button>
                              )}

                              {b.subscriptionStatus === 'active' && (
                                <button
                                  onClick={() => modifierAbonnement(b._id, 'suspended')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold
                                             bg-red-500/10 text-red-400
                                             hover:bg-red-500/20 transition-colors"
                                >
                                  Suspendre
                                </button>
                              )}
                            </>
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
            className="px-4 py-2 rounded-xl border border-border text-sm
                       text-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Précédent
          </button>
          <span className="text-muted text-sm">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-border text-sm
                       text-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}