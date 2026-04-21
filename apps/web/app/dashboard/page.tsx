'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart, Package, TrendingUp, Users,
  ArrowUp, ArrowDown, Clock, CheckCircle,
  Truck, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  resume: {
    commandesTotal:       number;
    commandesMois:        number;
    commandesLivrees:     number;
    produitsActifs:       number;
    chiffreAffairesTotal: number;
    chiffreAffairesMois:  number;
  };
  parStatut: Record<string, number>;
  evolution: { date: string; commandes: number; revenue: number }[];
}

// ─── Composant carte métrique ─────────────────────────────────────────────────

function CarteMetrique({
  titre,
  valeur,
  sousTitre,
  icone: Icone,
  couleur,
  tendance,
}: {
  titre:     string;
  valeur:    string | number;
  sousTitre?: string;
  icone:     any;
  couleur:   string;
  tendance?: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${couleur}`}>
          <Icone size={20} className="text-white" />
        </div>
        {tendance && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            tendance === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {tendance === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{valeur}</p>
      <p className="text-muted text-sm font-medium">{titre}</p>
      {sousTitre && <p className="text-muted text-xs mt-1">{sousTitre}</p>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { token, shop } = useAuth();
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/basic`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (result.success) setStats(result.data);
      } catch (error) {
        console.error('Erreur chargement stats :', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const formatFcfa = (montant: number) =>
    new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-elevated rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-elevated rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const resume = stats?.resume;

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-muted text-sm mt-1">
            Bienvenue, voici un aperçu de votre activité
          </p>
        </div>
        {shop?.subscriptionStatus === 'trial' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
            <p className="text-blue-400 text-sm font-medium">
              🎉 Période d'essai en cours
            </p>
          </div>
        )}
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CarteMetrique
          titre="Commandes ce mois"
          valeur={resume?.commandesMois ?? 0}
          sousTitre={`${resume?.commandesTotal ?? 0} au total`}
          icone={ShoppingCart}
          couleur="bg-primary/80"
          tendance="up"
        />
        <CarteMetrique
          titre="CA ce mois"
          valeur={formatFcfa(resume?.chiffreAffairesMois ?? 0)}
          sousTitre={`${formatFcfa(resume?.chiffreAffairesTotal ?? 0)} au total`}
          icone={TrendingUp}
          couleur="bg-blue-500/80"
          tendance="up"
        />
        <CarteMetrique
          titre="Produits actifs"
          valeur={resume?.produitsActifs ?? 0}
          sousTitre={shop?.planType === 'basic' ? 'Max 10 (Basic)' : 'Illimité (Premium)'}
          icone={Package}
          couleur="bg-purple-500/80"
          tendance={null}
        />
        <CarteMetrique
          titre="Commandes livrées"
          valeur={resume?.commandesLivrees ?? 0}
          sousTitre="Paiement encaissé"
          icone={Users}
          couleur="bg-orange-500/80"
          tendance="up"
        />
      </div>

      {/* Graphique évolution + Statuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graphique commandes */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-6">
            Évolution des commandes (30 derniers jours)
          </h2>
          {stats?.evolution && stats.evolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.evolution}>
                <defs>
                  <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06C167" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06C167" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis stroke="#888888" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    border:          '1px solid #2a2a2a',
                    borderRadius:    '12px',
                    color:           '#ffffff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="commandes"
                  stroke="#06C167"
                  strokeWidth={2}
                  fill="url(#colorCommandes)"
                  name="Commandes"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted text-sm">
                Pas encore de données — vos graphiques apparaîtront ici
              </p>
            </div>
          )}
        </div>

        {/* Statuts commandes */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-6">Statuts des commandes</h2>
          <div className="space-y-3">
            {[
              { label: 'Nouvelles',    key: 'new',       icone: Clock,       couleur: 'text-blue-400',   bg: 'bg-blue-500/10' },
              { label: 'Confirmées',   key: 'confirmed', icone: CheckCircle, couleur: 'text-primary',    bg: 'bg-primary/10' },
              { label: 'En livraison', key: 'shipping',  icone: Truck,       couleur: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Livrées',      key: 'delivered', icone: CheckCircle, couleur: 'text-green-400',  bg: 'bg-green-500/10' },
              { label: 'Annulées',     key: 'cancelled', icone: XCircle,     couleur: 'text-red-400',    bg: 'bg-red-500/10' },
            ].map((item) => {
              const Icone = item.icone;
              const count = stats?.parStatut?.[item.key] ?? 0;
              return (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                      <Icone size={14} className={item.couleur} />
                    </div>
                    <span className="text-muted text-sm">{item.label}</span>
                  </div>
                  <span className="text-white font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/produits',  label: 'Gérer les produits', emoji: '📦' },
          { href: '/dashboard/commandes', label: 'Voir les commandes', emoji: '🛒' },
          { href: '/dashboard/themes',    label: 'Changer de thème',   emoji: '🎨' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-surface border border-border hover:border-primary/40 rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-elevated group"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-white text-sm font-medium group-hover:text-primary transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}