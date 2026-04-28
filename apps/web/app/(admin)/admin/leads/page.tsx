'use client';

import { useState, useEffect } from 'react';
import {
  Search, X, Loader2, RefreshCw,
  User, Phone, Mail, MessageSquare,
  CheckCircle, Clock, TrendingUp,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
};

const STATUTS = {
  new:       { label: 'Nouveau',    classe: 'bg-blue-500/10 text-blue-400 border-blue-500/30'    },
  contacted: { label: 'Contacté',   classe: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  converted: { label: 'Converti',   classe: 'bg-primary/10 text-primary border-primary/30'       },
};

export default function PageLeads() {
  const [leads,        setLeads]        = useState<any[]>([]);
  const [chargement,   setChargement]   = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [actionId,     setActionId]     = useState<string | null>(null);

  const charger = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '20',
        ...(filtreStatut && { status: filtreStatut }),
      });
      const res  = await authFetch(`${API}/admin/leads?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [page, filtreStatut]);

  const changerStatut = async (id: string, status: string) => {
    setActionId(id);
    try {
      await authFetch(`${API}/admin/leads/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      charger();
    } finally {
      setActionId(null);
    }
  };

  const leadsFiltres = leads.filter(l => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  });

  const stats = {
    new:       leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Leads Koffi</h1>
          <p className="text-muted text-sm mt-1">
            {total} prospect{total > 1 ? 's' : ''} collecté{total > 1 ? 's' : ''} par l'agent IA
          </p>
        </div>
        <button onClick={charger}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition-colors">
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nouveaux',  count: stats.new,       couleur: '#3b82f6', icone: <Clock size={18} />        },
          { label: 'Contactés', count: stats.contacted, couleur: '#f59e0b', icone: <Phone size={18} />        },
          { label: 'Convertis', count: stats.converted, couleur: '#06C167', icone: <TrendingUp size={18} />   },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted text-sm">{s.label}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: `${s.couleur}15`, color: s.couleur }}>
                {s.icone}
              </div>
            </div>
            <p className="text-white text-2xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60 flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl">
          <Search size={16} className="text-muted" />
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-muted" />
          {recherche && (
            <button onClick={() => setRecherche('')}>
              <X size={14} className="text-muted hover:text-white" />
            </button>
          )}
        </div>
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-white outline-none">
          <option value="">Tous les statuts</option>
          <option value="new">Nouveau</option>
          <option value="contacted">Contacté</option>
          <option value="converted">Converti</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {chargement ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : leadsFiltres.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucun lead trouvé</p>
            <p className="text-xs mt-2">Les leads sont collectés par Koffi sur la landing page</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Prospect', 'Contact', 'Message', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leadsFiltres.map(lead => {
                  const statut  = STATUTS[lead.status as keyof typeof STATUTS] ?? STATUTS['new'];
                  const loading = actionId === lead._id;
                  return (
                    <tr key={lead._id} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-muted" />
                          </div>
                          <p className="text-white text-sm font-medium">{lead.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted">
                              <Phone size={11} className="text-primary" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted">
                              <Mail size={11} className="text-primary" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-muted text-xs line-clamp-2">
                          {lead.message ?? '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statut.classe}`}>
                          {statut.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-muted text-xs">{formatDate(lead.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {loading ? (
                            <Loader2 size={15} className="animate-spin text-muted" />
                          ) : (
                            <>
                              {lead.status === 'new' && (
                                <button onClick={() => changerStatut(lead._id, 'contacted')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                                  Contacté
                                </button>
                              )}
                              {lead.status !== 'converted' && (
                                <button onClick={() => changerStatut(lead._id, 'converted')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                  Converti
                                </button>
                              )}
                              {lead.status === 'converted' && (
                                <CheckCircle size={15} className="text-primary" />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-white disabled:opacity-30 transition-colors">
            ← Précédent
          </button>
          <span className="text-muted text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-white disabled:opacity-30 transition-colors">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}