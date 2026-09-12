'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Search, Package, Heart, User } from 'lucide-react';

const ONGLETS = [
  { label: 'Boutiques', href: '/boutiques',    icone: Store   },
  { label: 'Recherche', href: '/recherche',    icone: Search  },
  { label: 'Favoris',   href: '/mes-favoris',  icone: Heart   },
  { label: 'Commandes', href: '/mes-commandes',icone: Package },
  { label: 'Profil',    href: '/profil',       icone: User    },
] as const;

export default function BottomNavBar() {
  const pathname = usePathname();

  const estActif = (href: string) => {
    if (href === '/boutiques') return pathname === '/boutiques';
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {ONGLETS.map(({ label, href, icone: Icone }) => {
          const actif = estActif(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            >
              <Icone
                size={22}
                strokeWidth={actif ? 2.4 : 1.8}
                className="transition-colors"
                style={{ color: actif ? '#06C167' : '#888888' }}
              />

              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: actif ? '#06C167' : '#888888' }}
              >
                {label}
              </span>

              {actif && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: '#06C167' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}