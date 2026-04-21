'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, TrendingUp, Users, ShoppingBag,
  CreditCard, BarChart3,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

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
function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-muted text-xs mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name} : {p.name === 'Revenus' ? formatFcfa(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function PageAnalyticsAdmin() {
  const [stats,      setStats]      = useState<any>(null);
  const [evolution,  setEvolution]  = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [periode,    setPeriode]    = useState<'7j' | '30j' | '90j'>('30j');

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const [statsRes, evolutionRes] = await Promise.all([
          authFetch(`${API}/admin/stats`),
          authFetch(`${API}/admin/analytics?periode=${periode}`),
        ]);

        const statsData     = await statsRes.json();
        const evolutionData = await evolutionRes.json();

        if (statsData.success)     setStats(statsData.data);
        if (evolutionData.success) setEvolution(evolutionData.data);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [periode]);

  const dataPlan = stats ? [
    { name: 'Premium', value: stats.abonnements?.premium_count ?? 0, color: '#f59e0b' },
    { name: 'Basic',   value: stats.abonnements?.basic_count   ?? 0, color: '#06C167' },
    { name: 'Essai',   value: stats.marchands?.trial           ?? 0, color: '#3b82f6' },
    { name: 'Expiré',  value: stats.abonnements?.expires_count ?? 0, color: '#ef4444' },
  ] : [];

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Analytics plateforme</h1>
          <p className="text-muted text-sm mt-1">Vue globale de ShopEasy CI</p>
        </div>
        <div className="flex bg-elevated border border-border rounded-xl p-1 gap-1">
          {(['7j', '30j', '90j'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${periode === p
                            ? 'bg-primary text-white'
                            : 'text-muted hover:text-white'}`}
            >
              {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs globaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label:   'Total boutiques',
            valeur:  stats?.boutiques?.total ?? 0,
            sous:    `${stats?.boutiques?.nouvellesCeMois ?? 0} ce mois`,
            icone:   <BarChart3    size={18} />,
            couleur: '#06C167',
          },
          {
            label:   'Marchands actifs',
            valeur:  stats?.boutiques?.actives ?? 0,
            sous:    `${stats?.boutiques?.trial ?? 0} en essai`,
            icone:   <Users        size={18} />,
            couleur: '#3b82f6',
          },
          {
            label:   'Commandes totales',
            valeur:  stats?.commandes?.total ?? 0,
            sous:    `${stats?.commandes?.nouvelles ?? 0} nouvelles`,
            icone:   <ShoppingBag  size={18} />,
            couleur: '#f59e0b',
          },
          {
            label:   'MRR',
            valeur:  formatFcfa(stats?.mrr ?? 0),
            sous:    `${stats?.abonnements?.premium_count ?? 0} Premium actifs`,
            icone:   <CreditCard   size={18} />,
            couleur: '#8b5cf6',
          },
        ].map(kpi => (
          <div key={kpi.label}
               className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">{kpi.label}</span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${kpi.couleur}15`, color: kpi.couleur }}
              >
                {kpi.icone}
              </div>
            </div>
            <p className="text-white text-2xl font-bold">{kpi.valeur}</p>
            <p className="text-muted text-xs">{kpi.sous}</p>
          </div>
        ))}
      </div>

      {/* ── Graphique évolution ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Évolution de la plateforme
        </h2>
        {evolution.length === 0 ? (
          <div className="text-center py-16 text-muted">
            Pas encore de données pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
              <YAxis                stroke="#888" tick={{ fontSize: 12 }} />
              <Tooltip content={<TooltipCustom />} />
              <Legend />
              <Line type="monotone" dataKey="boutiques" name="Nouvelles boutiques"
                    stroke="#06C167" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="commandes" name="Commandes"
                    stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Revenus ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Revenus (FCFA)</h2>
          {evolution.length === 0 ? (
            <p className="text-muted text-sm text-center py-10">
              Pas encore de données
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis               stroke="#888" tick={{ fontSize: 11 }} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="revenus" name="Revenus" fill="#8b5cf6"
                     radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Répartition plans ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Répartition des plans</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={dataPlan} cx="50%" cy="50%"
                     innerRadius={45} outerRadius={70}
                     paddingAngle={3} dataKey="value">
                  {dataPlan.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {dataPlan.map(d => {
                const total = dataPlan.reduce((s, x) => s + x.value, 0);
                const pct   = total ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full"
                             style={{ backgroundColor: d.color }} />
                        <span className="text-muted">{d.name}</span>
                      </div>
                      <span className="text-white font-medium">
                        {d.value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                           style={{ width: `${pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Résumé utilisateurs ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Résumé utilisateurs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Marchands',     valeur: stats?.utilisateurs?.marchands ?? 0, couleur: '#06C167' },
            { label: 'Clients',       valeur: stats?.utilisateurs?.clients   ?? 0, couleur: '#3b82f6' },
            { label: 'Leads',         valeur: stats?.leads?.total            ?? 0, couleur: '#f59e0b' },
            { label: 'Nouveaux leads',valeur: stats?.leads?.nouveaux         ?? 0, couleur: '#8b5cf6' },
          ].map(u => (
            <div key={u.label}
                 className="bg-elevated rounded-xl p-4 border border-border">
              <p className="text-muted text-xs mb-1">{u.label}</p>
              <p className="text-2xl font-bold" style={{ color: u.couleur }}>
                {u.valeur.toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}