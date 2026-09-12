'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, ChevronDown, Package, Heart, MapPin, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Navbar dediee a l'espace client — aucun lien marketing (Tarifs/Themes/FAQ) ──
export default function ClientNavbar() {
  const [menuClient, setMenuClient] = useState(false);
  const { user, logout, isConnecte } = useAuth();
  const refMenuClient = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (refMenuClient.current && !refMenuClient.current.contains(e.target as Node)) {
        setMenuClient(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const LIENS_CLIENT = [
    { label: 'Mes commandes', href: '/mes-commandes', icon: Package },
    { label: 'Mes favoris',   href: '/mes-favoris',   icon: Heart   },
    { label: 'Mes adresses',  href: '/mes-adresses',  icon: MapPin  },
    { label: 'Mon profil',    href: '/profil',        icon: User    },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-surface border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">

        {/* Logo — mene vers l'espace boutiques, jamais vers la landing marketing */}
        <Link href="/boutiques" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/Shop.png" alt="ShopEasy CI" width={140} height={60} className="object-contain w-24 sm:w-[140px] h-auto" priority />
        </Link>

        {/* Compte */}
        {isConnecte && user?.role === 'client' ? (
          <div className="relative" ref={refMenuClient}>
            <button
              onClick={() => setMenuClient(!menuClient)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border bg-elevated hover:border-primary/40 transition-colors text-sm font-medium text-white"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              <ChevronDown size={14} className={`text-muted transition-transform ${menuClient ? 'rotate-180' : ''}`} />
            </button>

            {menuClient && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-elevated">
                  <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-muted text-xs truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  {LIENS_CLIENT.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuClient(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-muted hover:text-white hover:bg-elevated transition-colors text-sm"
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-border py-1">
                  <button
                    onClick={() => { logout(); setMenuClient(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                  >
                    <LogOut size={15} />
                    Deconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/connexion"
              className="text-muted hover:text-white transition-colors text-xs sm:text-sm font-medium whitespace-nowrap">
              Connexion
            </Link>
            {/* Compte CLIENT — jamais marchand */}
            <Link href="/inscription-client"
              className="bg-primary hover:bg-primary-hover text-black font-semibold text-xs sm:text-sm px-2.5 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
              <span className="sm:hidden">S'inscrire</span>
              <span className="hidden sm:inline">Creer mon compte client</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}