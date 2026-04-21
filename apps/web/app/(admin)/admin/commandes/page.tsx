'use client';

import { useState, useEffect } from 'react';
import Link                    from 'next/link';
import {
  Search, X, Loader2, RefreshCw,
  ShoppingBag, Clock, CheckCircle,
  Truck, XCircle, Eye,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUTS = {
  new:       { label: 'Nouvelle',    icone: <ShoppingBag size={13} />, classe: 'bg-blue-500/10 text-blue-400 border-blue-500/30'     },
  confirmed: { label: 'Confirmée',   icone: <CheckCircle size={13} />, classe: 'bg-amber-500/10 text-amber-400 border-amber-500/30'  },
  shipping:  { label: 'En livraison',icone: <Truck       size={13} />, classe: 'bg-purple-500/10 text-purple-400 border-purple-500/30'},
  delivered: { label: 'Livrée',      icone: <CheckCircle size={13} />, classe: 'bg-primary/10 text-primary border-primary/30'        },
  cancelled: { label: 'Annulée',     icone: <XCircle     size={13} />, classe: 'bg-red-500/10 text-red-400 border-red-500/30'        },
};

// ---------------------------------------------------------------------------
interface Commande {
  _id:         string;
  orderNumber: string;
  shopId:      string;
  nomClient:   string;
  telephone:   string;
  total:       number;
  status:      keyof typeof STATUTS;
  items:       any[];
  createdAt:   string;
  customer?:   { name: string; phone: string };
}

// ---------------------------------------------------------------------------
export default function PageCommandesAdmin() {
  const [commandes,    setCommandes]    = useState<Commande[]>([]);
  const [chargement,   setChargement]   = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams({
        page:  String(page),
        limit: '20',
        ...(filtreStatut && { status: filtreStatut }),
      });

      const res  = await fetch(`${API}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setCommandes(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [page, filtreStatut]);

  // -- Filtrage local par recherche --
  const commandesFiltrees = commandes.filter(c => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      c.orderNumber.toLowerCase().includes(q)  ||
      (c.nomClient ?? c.customer?.name ?? '').toLowerCase().includes(q) ||
      (c.telephone ?? c.customer?.phone ?? '').includes(q)
    );
  });

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Commandes</h1>
          <p className="text-muted text-sm mt-1">
            {total} commande{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={charger}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border
                     border-border text-muted hover:text-white text-sm
                     transition-colors"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(STATUTS) as [string, any][]).map(([key, val]) => {
          const count = commandes.filter(c => c.status === key).length;
          return (
            <button
              key={key}
              onClick={() => {
                setFiltreStatut(filtreStatut === key ? '' : key);
                setPage(1);
              }}
              className={`p-3 rounded-xl border text-left transition-all
                          ${filtreStatut === key
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-surface hover:border-primary/30'}`}
            >
              <p className="text-muted text-xs">{val.label}</p>
              <p className="text-white font-bold text-lg mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60 flex items-center gap-2 px-4 py-2.5
                        bg-surface border border-border rounded-xl">
          <Search size={16} className="text-muted" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="N° commande, client, téléphone..."
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
          {Object.entries(STATUTS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {chargement ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : commandesFiltrees.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['N° Commande', 'Client', 'Articles', 'Total', 'Statut', 'Date', ''].map(h => (
                    <th key={h}
                        className="text-left px-5 py-3.5 text-xs font-semibold
                                   text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {commandesFiltrees.map(c => {
                  const statut = STATUTS[c.status] ?? STATUTS['new'];
                  const client = c.nomClient ?? c.customer?.name ?? '—';
                  const tel    = c.telephone ?? c.customer?.phone ?? '—';

                  return (
                    <tr key={c._id}
                        className="hover:bg-elevated/50 transition-colors">

                      {/* N° commande */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-mono font-medium">
                          {c.orderNumber}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{client}</p>
                        <p className="text-muted text-xs">{tel}</p>
                      </td>

                      {/* Articles */}
                      <td className="px-5 py-4">
                        <p className="text-muted text-sm">
                          {c.items?.length ?? 0} article{(c.items?.length ?? 0) > 1 ? 's' : ''}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4">
                        <p className="text-white font-semibold text-sm">
                          {formatFcfa(c.total)}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs
                                         font-semibold px-2.5 py-1 rounded-full border
                                         ${statut.classe}`}>
                          {statut.icone}
                          {statut.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-muted text-xs">
                          {formatDate(c.createdAt)}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/commandes/${c._id}`}
                          className="p-1.5 rounded-lg text-muted hover:text-white
                                     hover:bg-elevated transition-colors inline-flex"
                        >
                          <Eye size={15} />
                        </Link>
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
          <span className="text-muted text-sm">
            Page {page} / {totalPages}
          </span>
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