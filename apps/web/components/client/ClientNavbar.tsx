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
    <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo — mene vers l'espace boutiques, jamais vers la landing marketing */}
        <Link href="/boutiques" className="flex items-center">
          <Image src="/Shop.png" alt="ShopEasy CI" width={120} height={52} className="object-contain" priority />
        </Link>

        {/* Compte */}
        {isConnecte && user?.role === 'client' ? (
          <div className="relative" ref={refMenuClient}>
            <button
              onClick={() => setMenuClient(!menuClient)}
              className="flex items-center gap-2 text-muted hover:text-white transition-colors text-sm font-medium"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline">{user.name}</span>
              <ChevronDown size={14} className={`transition-transform ${menuClient ? 'rotate-180' : ''}`} />
            </button>

            {menuClient && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
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
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="text-muted hover:text-white transition-colors text-sm font-medium">
              Connexion
            </Link>
            <Link href="/inscription-client"
              className="bg-primary hover:bg-primary-hover text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              Creer mon compte
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}