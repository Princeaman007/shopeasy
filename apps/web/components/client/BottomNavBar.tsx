'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Search, Package, ShoppingCart, User } from 'lucide-react';

interface Props {
  nbArticlesPanier?: number;
}

const ONGLETS = [
  { label: 'Boutiques', href: '/boutiques',      icone: Store       },
  { label: 'Recherche', href: '/recherche',       icone: Search      },
  { label: 'Panier',    href: '/panier',          icone: ShoppingCart },
  { label: 'Commandes', href: '/mes-commandes',   icone: Package     },
  { label: 'Profil',    href: '/profil',          icone: User        },
] as const;

export default function BottomNavBar({ nbArticlesPanier = 0 }: Props) {
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
              <div className="relative">
                <Icone
                  size={22}
                  strokeWidth={actif ? 2.4 : 1.8}
                  className="transition-colors"
                  style={{ color: actif ? '#06C167' : '#888888' }}
                />

                {href === '/panier' && nbArticlesPanier > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                    style={{ backgroundColor: '#06C167' }}
                  >
                    {nbArticlesPanier > 9 ? '9+' : nbArticlesPanier}
                  </span>
                )}
              </div>

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