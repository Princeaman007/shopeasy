'use client';

import { useState }       from 'react';
import Link               from 'next/link';
import { usePathname }    from 'next/navigation';
import {
  LayoutDashboard, Users, ShoppingBag, Package,
  BarChart3, CreditCard, Bell, Settings,
  LogOut, Shield, Tag, Menu, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const LIENS = [
  {
    groupe: 'Principal',
    items: [
      { href: '/admin',               label: "Vue d'ensemble", icone: LayoutDashboard },
      { href: '/admin/marchands',     label: 'Marchands',      icone: Users           },
      { href: '/admin/commandes',     label: 'Commandes',      icone: ShoppingBag     },
      { href: '/admin/produits',      label: 'Produits',       icone: Package         },
    ],
  },
  {
    groupe: 'Finance',
    items: [
      { href: '/admin/abonnements',   label: 'Abonnements',    icone: CreditCard      },
      { href: '/admin/analytics',     label: 'Analytics',      icone: BarChart3       },
    ],
  },
  {
    groupe: 'Gestion',
    items: [
      { href: '/admin/notifications', label: 'Notifications',  icone: Bell            },
      { href: '/admin/parametres',    label: 'Paramètres',     icone: Settings        },
    ],
  },
];

// ---------------------------------------------------------------------------
function NavContenu({
  pathname,
  onLinkClick,
}: {
  pathname:    string;
  onLinkClick?: () => void;
}) {
  const deconnecter = async () => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method:      'POST',
      credentials: 'include',
    });
  } catch {}

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('shop');

  window.location.href = '/connexion';
};

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center
                          justify-center flex-shrink-0">
            <Shield size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">ShopEasy CI</p>
            <p className="text-xs text-muted">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {LIENS.map(groupe => (
          <div key={groupe.groupe} className="space-y-1">
            <p className="text-xs font-semibold text-muted uppercase
                          tracking-wider px-3 mb-2">
              {groupe.groupe}
            </p>
            {groupe.items.map(item => {
              const Icone = item.icone;
              const actif = pathname === item.href ||
                            (item.href !== '/admin' &&
                             pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                              text-sm font-medium transition-colors
                              ${actif
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted hover:text-white hover:bg-elevated'}`}
                >
                  <Icone size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-4 border-t border-border flex-shrink-0">
        <button
          onClick={deconnecter}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-muted hover:text-red-400 hover:bg-red-400/10
                     transition-colors w-full"
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
export default function AdminNav() {
  const pathname          = usePathname();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside
        className="fixed left-0 top-0 h-screen w-64 border-r border-border
                   flex-col z-30 hidden lg:flex"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <NavContenu pathname={pathname} />
      </aside>

      {/* ── Topbar mobile ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center
                   justify-between px-4 py-3 border-b border-border"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center
                          justify-center">
            <Shield size={16} className="text-primary" />
          </div>
          <p className="font-bold text-white text-sm">Admin</p>
        </div>

        <button
          onClick={() => setOuvert(!ouvert)}
          className="p-2 rounded-xl text-muted hover:text-white
                     hover:bg-elevated transition-colors"
        >
          {ouvert
            ? <X    size={20} />
            : <Menu size={20} />
          }
        </button>
      </div>

      {/* ── Drawer mobile ── */}
      {ouvert && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setOuvert(false)}
          />

          {/* Drawer */}
          <aside
            className="lg:hidden fixed left-0 top-0 h-screen w-72 z-50
                       flex flex-col border-r border-border"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <NavContenu
              pathname={pathname}
              onLinkClick={() => setOuvert(false)}
            />
          </aside>
        </>
      )}
    </>
  );
}