'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, Package, Heart, MapPin, User } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [menuClient, setMenuClient]   = useState(false);
  const { user, logout, isConnecte }  = useAuth();
  const refMenuClient                 = useRef<HTMLDivElement>(null);

  // Ferme le menu client si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (refMenuClient.current && !refMenuClient.current.contains(e.target as Node)) {
        setMenuClient(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Liens espace client
  const LIENS_CLIENT = [
    { label: 'Mes commandes', href: '/mes-commandes', icon: Package  },
    { label: 'Mes favoris',   href: '/mes-favoris',   icon: Heart    },
    { label: 'Mes adresses',  href: '/mes-adresses',  icon: MapPin   },
    { label: 'Mon profil',    href: '/profil',         icon: User     },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">

          {/* Logo */}
          <Link href="/">
            <Image src="/Shop.png" alt="ShopEasy CI" width={160} height={70} className="object-contain mt-4" priority />
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/tarifs" className="text-muted hover:text-white transition-colors text-sm font-medium">Tarifs</Link>
            <Link href="/themes" className="text-muted hover:text-white transition-colors text-sm font-medium">Thèmes</Link>
            <Link href="/boutiques" className="text-muted hover:text-white transition-colors text-sm font-medium">Boutiques</Link>
            <Link href="/#faq" className="text-muted hover:text-white transition-colors text-sm font-medium">FAQ</Link>
          </div>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isConnecte ? (
              <>
                {/* ── Marchand ── */}
                {user?.role === 'merchant' && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-muted hover:text-white transition-colors text-sm font-medium"
                  >
                    <LayoutDashboard size={16} />
                    {user.name}
                  </Link>
                )}

                {/* ── Admin ── */}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-muted hover:text-white transition-colors text-sm font-medium"
                  >
                    <LayoutDashboard size={16} />
                    Admin
                  </Link>
                )}

                {/* ── Client — menu déroulant ── */}
                {user?.role === 'client' && (
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
                      {user.name}
                      <ChevronDown size={14} className={`transition-transform ${menuClient ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
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
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Déconnexion (marchand + admin) */}
                {user?.role !== 'client' && (
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-elevated hover:bg-border border border-border text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                )}
              </>
            ) : (
              <>
                <Link href="/connexion" className="text-muted hover:text-white transition-colors text-sm font-medium">
                  Connexion
                </Link>
                <Link href="/inscription" className="bg-primary hover:bg-primary-hover text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
                  Créer ma boutique
                </Link>
              </>
            )}
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden text-muted hover:text-white transition-colors"
          >
            {menuOuvert ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOuvert && (
        <div className="md:hidden bg-surface border-t border-border px-4 py-4 space-y-3">
          <Link href="/tarifs" className="block text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>Tarifs</Link>
          <Link href="/themes" className="block text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>Thèmes</Link>
          <Link href="/boutiques" className="block text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>Boutiques</Link>
          <Link href="/#faq" className="block text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>FAQ</Link>

          <div className="pt-3 border-t border-border space-y-2">
            {isConnecte ? (
              <>
                {/* Marchand mobile */}
                {user?.role === 'merchant' && (
                  <Link href="/dashboard" className="block text-center text-white py-2 font-medium" onClick={() => setMenuOuvert(false)}>
                    Dashboard — {user.name}
                  </Link>
                )}

                {/* Admin mobile */}
                {user?.role === 'admin' && (
                  <Link href="/admin" className="block text-center text-white py-2 font-medium" onClick={() => setMenuOuvert(false)}>
                    Admin — {user.name}
                  </Link>
                )}

                {/* Client mobile */}
                {user?.role === 'client' && (
                  <div className="space-y-1">
                    <p className="text-muted text-xs uppercase tracking-wide px-2 py-1">Mon compte — {user.name}</p>
                    {LIENS_CLIENT.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOuvert(false)}
                        className="flex items-center gap-3 px-2 py-2.5 text-muted hover:text-white transition-colors text-sm rounded-lg hover:bg-elevated"
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { logout(); setMenuOuvert(false); }}
                  className="w-full text-center bg-elevated border border-border text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" className="block text-center text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>Connexion</Link>
                <Link href="/inscription" className="block text-center bg-primary hover:bg-primary-hover text-black font-semibold py-2 rounded-lg transition-colors" onClick={() => setMenuOuvert(false)}>Créer ma boutique</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}