'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, TrendingUp, Users, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AnalyticsJour {
  date:       string;
  visitors:   number;
  orders:     number;
  revenue:    number;
  conversion: number;
  sources:    { instagram: number; tiktok: number; facebook: number; direct: number; other: number };
  topProducts: { productId: string; name: string; views: number; orders: number }[];
}

interface StatCard {
  label:    string;
  valeur:   string;
  variation: number;
  icone:    React.ReactNode;
  couleur:  string;
}

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

// ---------------------------------------------------------------------------
// Tooltip personnalisé pour les graphiques
// ---------------------------------------------------------------------------
function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-muted text-xs mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name} : {typeof p.value === 'number' && p.name === 'Revenus'
            ? formatFcfa(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant carte statistique
// ---------------------------------------------------------------------------
function CarteStatAnalytics({ label, valeur, variation, icone, couleur }: StatCard) {
  const positif = variation >= 0;
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-muted text-sm">{label}</span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${couleur}15`, color: couleur }}
        >
          {icone}
        </div>
      </div>
      <p className="text-white text-2xl font-bold">{valeur}</p>
      <div className={`flex items-center gap-1 text-xs font-medium
                      ${positif ? 'text-primary' : 'text-red-400'}`}>
        <TrendingUp size={12} className={positif ? '' : 'rotate-180'} />
        {positif ? '+' : ''}{variation}% vs semaine dernière
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PageAnalytics() {
  const [analytics,   setAnalytics]   = useState<AnalyticsJour[]>([]);
  const [planType,    setPlanType]    = useState<'basic' | 'premium'>('basic');
  const [chargement,  setChargement]  = useState(true);
  const [periode,     setPeriode]     = useState<'7j' | '30j'>('7j');

  // -- Chargement --
 useEffect(() => {
  const charger = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Verifie le plan
      const shopRes  = await fetch(`${API}/shops/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const shopData = await shopRes.json();
      if (shopData.success) setPlanType(shopData.data.planType);

      // Charge les analytics avances
      const nbJours = periode === '7j' ? 7 : 30;
      const res = await fetch(`${API}/analytics/advanced?periode=${nbJours}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setAnalytics(data.data.evolution.map((j: any) => ({
          date:        j.date,
          visitors:    j.visiteurs,
          orders:      j.commandes,
          revenue:     j.revenue,
          conversion:  j.conversion,
          sources:     { instagram: 0, tiktok: 0, facebook: 0, direct: 0, other: 0 },
          topProducts: (data.data.topProduits ?? []).map((p: any) => ({
            productId: p._id,
            name:      p.name,
            views:     0,
            orders:    p.commandes,
          })),
        })));
      }
    } finally {
      setChargement(false);
    }
  };
  charger();
}, [periode]);

  // -- Calcul des totaux --
  const totaux = analytics.reduce(
    (acc, jour) => ({
      visitors: acc.visitors + jour.visitors,
      orders:   acc.orders   + jour.orders,
      revenue:  acc.revenue  + jour.revenue,
    }),
    { visitors: 0, orders: 0, revenue: 0 }
  );

  const conversionMoy = analytics.length
    ? analytics.reduce((a, j) => a + j.conversion, 0) / analytics.length
    : 0;

  // -- Données sources trafic (agrégées) --
  const sources = analytics.reduce(
    (acc, j) => ({
      Instagram: acc.Instagram + j.sources.instagram,
      TikTok:    acc.TikTok    + j.sources.tiktok,
      Facebook:  acc.Facebook  + j.sources.facebook,
      Direct:    acc.Direct    + j.sources.direct,
      Autre:     acc.Autre     + j.sources.other,
    }),
    { Instagram: 0, TikTok: 0, Facebook: 0, Direct: 0, Autre: 0 }
  );
  const totalSources = Object.values(sources).reduce((a, b) => a + b, 0);

  // -- Top produits (agrégés) --
  const topProduits = analytics
    .flatMap(j => j.topProducts)
    .reduce((acc: any[], p) => {
      const exist = acc.find(a => a.productId === p.productId);
      if (exist) { exist.views += p.views; exist.orders += p.orders; }
      else acc.push({ ...p });
      return acc;
    }, [])
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  // ---------------------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // -- Mur Premium --
  if (planType !== 'premium') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20
                        flex items-center justify-center">
          <Lock size={36} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold">Analytics avancés</h1>
          <p className="text-muted mt-2 max-w-sm">
            Accède aux statistiques détaillées de ta boutique en passant au plan Premium.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2 text-left max-w-sm w-full">
          {[
            'Visiteurs uniques par jour',
            'Taux de conversion',
            'Sources de trafic (Instagram, TikTok...)',
            'Top produits les plus vus',
            'Revenus sur 30 jours',
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/parametres/abonnement"
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold
                     px-6 py-3 rounded-xl transition-colors"
        >
          Passer en Premium →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* En-tête + sélecteur période */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Analytics</h1>
          <p className="text-muted text-sm mt-1">Statistiques détaillées de ta boutique</p>
        </div>
        <div className="flex bg-elevated border border-border rounded-xl p-1 gap-1">
          {(['7j', '30j'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${periode === p
                            ? 'bg-primary text-white'
                            : 'text-muted hover:text-white'}`}
            >
              {p === '7j' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cartes KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CarteStatAnalytics
          label="Visiteurs"
          valeur={totaux.visitors.toLocaleString('fr-FR')}
          variation={12}
          icone={<Users size={18} />}
          couleur="#06C167"
        />
        <CarteStatAnalytics
          label="Commandes"
          valeur={totaux.orders.toLocaleString('fr-FR')}
          variation={8}
          icone={<ShoppingCart size={18} />}
          couleur="#3b82f6"
        />
        <CarteStatAnalytics
          label="Revenus"
          valeur={formatFcfa(totaux.revenue)}
          variation={15}
          icone={<DollarSign size={18} />}
          couleur="#f59e0b"
        />
        <CarteStatAnalytics
          label="Conversion"
          valeur={`${conversionMoy.toFixed(1)}%`}
          variation={-2}
          icone={<TrendingUp size={18} />}
          couleur="#8b5cf6"
        />
      </div>

      {/* ── Graphique visiteurs + commandes ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Visiteurs & Commandes</h2>
        {analytics.length === 0 ? (
          <p className="text-muted text-sm text-center py-10">
            Pas encore de données pour cette période.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.map(j => ({
              date:       formatDate(j.date),
              Visiteurs:  j.visitors,
              Commandes:  j.orders,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
              <YAxis stroke="#888" tick={{ fontSize: 12 }} />
              <Tooltip content={<TooltipCustom />} />
              <Legend />
              <Line type="monotone" dataKey="Visiteurs"  stroke="#06C167" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Commandes"  stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Graphique revenus ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Revenus (FCFA)</h2>
        {analytics.length === 0 ? (
          <p className="text-muted text-sm text-center py-10">
            Pas encore de données pour cette période.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.map(j => ({
              date:    formatDate(j.date),
              Revenus: j.revenue,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
              <YAxis stroke="#888" tick={{ fontSize: 12 }} />
              <Tooltip content={<TooltipCustom />} />
              <Bar dataKey="Revenus" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Sources de trafic ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Eye size={18} className="text-primary" />
            Sources de trafic
          </h2>
          {totalSources === 0 ? (
            <p className="text-muted text-sm text-center py-6">Pas encore de données.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(sources).map(([nom, val]) => {
                const pct = totalSources ? Math.round((val / totalSources) * 100) : 0;
                const couleurs: Record<string, string> = {
                  Instagram: '#E1306C',
                  TikTok:    '#010101',
                  Facebook:  '#1877F2',
                  Direct:    '#06C167',
                  Autre:     '#888888',
                };
                return (
                  <div key={nom} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">{nom}</span>
                      <span className="text-white font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: couleurs[nom] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top produits ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            Top produits
          </h2>
          {topProduits.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">Pas encore de données.</p>
          ) : (
            <div className="space-y-3">
              {topProduits.map((p, i) => (
                <div key={p.productId}
                     className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-border">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs
                                   font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.name}</p>
                    <p className="text-muted text-xs">{p.views} vues</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary text-sm font-bold">{p.orders}</p>
                    <p className="text-muted text-xs">cmdses</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}