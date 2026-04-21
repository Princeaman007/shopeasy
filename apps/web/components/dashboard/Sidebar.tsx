'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingBag, LayoutDashboard, Package, ShoppingCart,
  Tag, Palette, Settings, BarChart2, Gift, Users,
  Share2, CreditCard, X, Menu, Crown,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',            icone: LayoutDashboard, label: 'Accueil',      premium: false, exact: true  },
  { href: '/dashboard/produits',   icone: Package,         label: 'Produits',     premium: false, exact: false },
  { href: '/dashboard/commandes',  icone: ShoppingCart,    label: 'Commandes',    premium: false, exact: false },
  { href: '/dashboard/categories', icone: Tag,             label: 'Catégories',   premium: false, exact: false },
  { href: '/dashboard/themes',     icone: Palette,         label: 'Thèmes',       premium: false, exact: false },
  { href: '/dashboard/analytics',  icone: BarChart2,       label: 'Analytics',    premium: true,  exact: false },
  { href: '/dashboard/codes-promo',icone: Gift,            label: 'Codes promo',  premium: true,  exact: false },
  { href: '/dashboard/equipe',     icone: Users,           label: 'Équipe',       premium: true,  exact: false },
];

const NAV_SETTINGS = [
  { href: '/dashboard/parametres/boutique',    icone: Settings,  label: 'Paramètres boutique' },
  { href: '/dashboard/parametres/partage',     icone: Share2,    label: 'Partage & QR Code'   },
  { href: '/dashboard/parametres/abonnement',  icone: CreditCard,label: 'Abonnement'           },
];

export default function Sidebar() {
  const pathname         = usePathname();
  const { shop, logout } = useAuth();
  const [mobileOuvert, setMobileOuvert] = useState(false);

  const isPremium = shop?.planType === 'premium';

  const isActif = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBag size={16} className="text-black" />
          </div>
          <span className="text-white font-bold">
            Shop<span className="text-primary">Easy</span> CI
          </span>
        </Link>

        {shop && (
          <div className="bg-elevated rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-semibold text-sm truncate">{shop.name}</p>
              {shop.isVerified && <span className="text-primary text-xs">✓</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isPremium ? 'bg-primary/20 text-primary' : 'bg-elevated border border-border text-muted'
              }`}>
                {isPremium ? '⭐ Premium' : 'Basic'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                shop.subscriptionStatus === 'active'  ? 'bg-green-500/20 text-green-400' :
                shop.subscriptionStatus === 'trial'   ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-red-500/20 text-red-400'
              }`}>
                {shop.subscriptionStatus === 'trial' ? 'Essai' :
                 shop.subscriptionStatus === 'active' ? 'Actif' : 'Expiré'}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icone  = item.icone;
          const actif  = isActif(item.href, item.exact);
          const bloque = item.premium && !isPremium;
          return (
            <Link
              key={item.href}
              href={bloque ? '/dashboard/parametres/abonnement' : item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                actif  ? 'bg-primary text-black' :
                bloque ? 'text-muted hover:bg-elevated' :
                         'text-muted hover:text-white hover:bg-elevated'
              }`}
              onClick={() => setMobileOuvert(false)}
            >
              <Icone size={18} />
              <span className="flex-1">{item.label}</span>
              {bloque && <Crown size={12} className="text-primary" />}
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <p className="text-muted text-xs font-medium px-3 uppercase tracking-wider">Paramètres</p>
        </div>

        {NAV_SETTINGS.map((item) => {
          const Icone = item.icone;
          const actif = isActif(item.href, false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                actif ? 'bg-primary text-black' : 'text-muted hover:text-white hover:bg-elevated'
              }`}
              onClick={() => setMobileOuvert(false)}
            >
              <Icone size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {!isPremium && (
        <div className="p-4 border-t border-border">
          <Link href="/dashboard/parametres/abonnement"
            className="block bg-primary/10 border border-primary/20 rounded-xl p-3 hover:bg-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={14} className="text-primary" />
              <p className="text-primary text-sm font-semibold">Passer en Premium</p>
            </div>
            <p className="text-muted text-xs">Produits illimités, analytics, codes promo...</p>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex-col z-30">
        <SidebarContent />
      </aside>

      <button
        onClick={() => setMobileOuvert(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-white"
      >
        <Menu size={20} />
      </button>

      {mobileOuvert && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOuvert(false)} />
          <aside className="md:hidden fixed left-0 top-0 h-full w-72 bg-surface border-r border-border z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-white font-bold">Menu</span>
              <button onClick={() => setMobileOuvert(false)} className="text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}