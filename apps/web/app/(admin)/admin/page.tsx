'use client';

import { useState, useEffect } from 'react';
import {
  Users, ShoppingBag, Package, CreditCard,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  ArrowUpRight, Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ---------------------------------------------------------------------------
interface Stats {
  marchands: {
    total:   number;
    basic:   number;
    premium: number;
    trial:   number;
    actifs:  number;
    expires: number;
  };
  commandes: {
    total:           number;
    nouvelles:       number;
    aujourd_hui:     number;
    chiffreAffaires: number;
  };
  produits: {
    total:  number;
    actifs: number;
  };
  abonnements: {
    revenus_mois:  number;
    basic_count:   number;
    premium_count: number;
    expires_count: number;
  };
}

// ---------------------------------------------------------------------------
function CarteKpi({
  label, valeur, variation, icone, couleur, sous,
}: {
  label:      string;
  valeur:     string;
  variation?: number;
  icone:      React.ReactNode;
  couleur:    string;
  sous?:      string;
}) {
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
      {sous && <p className="text-muted text-xs">{sous}</p>}
      {variation !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium
                        ${variation >= 0 ? 'text-primary' : 'text-red-400'}`}>
          <TrendingUp size={12} className={variation < 0 ? 'rotate-180' : ''} />
          {variation >= 0 ? '+' : ''}{variation}% ce mois
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function AdminOverviewPage() {
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [chargement, setChargement] = useState(true);
  const [activites,  setActivites]  = useState<any[]>([]);

  useEffect(() => {
    const charger = async () => {
      try {
        const token   = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [statsRes, activitesRes] = await Promise.all([
          fetch(`${API}/admin/stats`,     { headers, credentials: 'include' }),
          fetch(`${API}/admin/activites`, { headers, credentials: 'include' }),
        ]);

        const statsData     = await statsRes.json();
        const activitesData = await activitesRes.json();

        if (statsData.success)     setStats(statsData.data);
        if (activitesData.success) setActivites(activitesData.data);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

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
      <div>
        <h1 className="text-white text-2xl font-bold">Vue d'ensemble</h1>
        <p className="text-muted text-sm mt-1">
          Tableau de bord administrateur ShopEasy CI
        </p>
      </div>

      {/* ── KPIs principaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CarteKpi
          label="Marchands total"
          valeur={stats?.marchands.total.toLocaleString('fr-FR') ?? '—'}
          icone={<Users size={18} />}
          couleur="#06C167"
          sous={`${stats?.marchands.premium ?? 0} Premium · ${stats?.marchands.basic ?? 0} Basic`}
        />
        <CarteKpi
          label="Commandes totales"
          valeur={stats?.commandes.total.toLocaleString('fr-FR') ?? '—'}
          icone={<ShoppingBag size={18} />}
          couleur="#3b82f6"
          sous={`${stats?.commandes.nouvelles ?? 0} nouvelles`}
        />
        <CarteKpi
          label="Produits actifs"
          valeur={stats?.produits.actifs.toLocaleString('fr-FR') ?? '—'}
          icone={<Package size={18} />}
          couleur="#f59e0b"
          sous={`${stats?.produits.total ?? 0} au total`}
        />
        <CarteKpi
          label="Revenus du mois"
          valeur={stats ? formatFcfa(stats.abonnements.revenus_mois) : '—'}
          icone={<CreditCard size={18} />}
          couleur="#8b5cf6"
          sous={`${stats?.abonnements.premium_count ?? 0} abonnements Premium`}
        />
      </div>

      {/* ── Alertes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border"
          style={{
            backgroundColor: (stats?.marchands.expires ?? 0) > 0
              ? '#ef444415' : '#10b98115',
            borderColor: (stats?.marchands.expires ?? 0) > 0
              ? '#ef444430' : '#10b98130',
          }}
        >
          {(stats?.marchands.expires ?? 0) > 0
            ? <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
            : <CheckCircle  size={20} className="text-primary flex-shrink-0" />
          }
          <div>
            <p className="text-white text-sm font-semibold">
              {stats?.marchands.expires ?? 0} abonnement(s) expiré(s)
            </p>
            <p className="text-muted text-xs">À renouveler</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl border
                        bg-blue-500/10 border-blue-500/30">
          <ShoppingBag size={20} className="text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">
              {stats?.commandes.nouvelles ?? 0} commande(s) en attente
            </p>
            <p className="text-muted text-xs">À traiter par les marchands</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl border
                        bg-amber-500/10 border-amber-500/30">
          <Clock size={20} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">
              {stats?.marchands.trial ?? 0} marchand(s) en essai
            </p>
            <p className="text-muted text-xs">Période d'essai active</p>
          </div>
        </div>
      </div>

      {/* ── Activité récente ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Activité récente</h2>
          <span className="text-xs text-muted">Dernières 24h</span>
        </div>

        {activites.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">
            Aucune activité récente
          </p>
        ) : (
          <div className="space-y-3">
            {activites.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl
                                      bg-elevated border border-border">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                             flex-shrink-0 text-sm"
                  style={{
                    backgroundColor: a.couleur + '20',
                    color:           a.couleur,
                  }}
                >
                  {a.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {a.titre}
                  </p>
                  <p className="text-muted text-xs">{a.description}</p>
                </div>
                <span className="text-xs text-muted flex-shrink-0">
                  {a.temps}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Répartition plans ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Répartition des plans</h2>
          <div className="space-y-3">
            {[
              { label: 'Premium', count: stats?.marchands.premium ?? 0,
                total: stats?.marchands.total ?? 1, couleur: '#f59e0b' },
              { label: 'Basic',   count: stats?.marchands.basic   ?? 0,
                total: stats?.marchands.total ?? 1, couleur: '#06C167' },
              { label: 'En essai',count: stats?.marchands.trial   ?? 0,
                total: stats?.marchands.total ?? 1, couleur: '#3b82f6' },
            ].map(plan => {
              const pct = stats?.marchands.total
                ? Math.round((plan.count / plan.total) * 100)
                : 0;
              return (
                <div key={plan.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{plan.label}</span>
                    <span className="text-white font-medium">
                      {plan.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: plan.couleur }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Commandes aujourd'hui</h2>
          <div className="flex items-center justify-center py-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold text-primary">
                {stats?.commandes.aujourd_hui ?? 0}
              </p>
              <p className="text-muted text-sm">commandes passées</p>
              <div className="flex items-center gap-1 text-primary text-sm
                              justify-center">
                <ArrowUpRight size={14} />
                <span>Ce jour</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-elevated rounded-xl border border-border
                          text-center">
            <p className="text-muted text-xs">CA total plateforme</p>
            <p className="text-white font-bold text-lg mt-0.5">
              {stats ? formatFcfa(stats.commandes.chiffreAffaires) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}