'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const { user, logout, isConnecte } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingBag size={18} className="text-black" />
            </div>
            <span className="text-white font-bold text-lg">
              Shop<span className="text-primary">Easy</span> CI
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/tarifs" className="text-muted hover:text-white transition-colors text-sm font-medium">
              Tarifs
            </Link>
            <Link href="/themes" className="text-muted hover:text-white transition-colors text-sm font-medium">
              Thèmes
            </Link>
            <Link href="#boutiques" className="text-muted hover:text-white transition-colors text-sm font-medium">
              Boutiques
            </Link>
            <Link href="#faq" className="text-muted hover:text-white transition-colors text-sm font-medium">
              FAQ
            </Link>
          </div>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isConnecte ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-muted hover:text-white transition-colors text-sm font-medium"
                >
                  <LayoutDashboard size={16} />
                  {user?.name}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-elevated hover:bg-border border border-border text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="text-muted hover:text-white transition-colors text-sm font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="bg-primary hover:bg-primary-hover text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Créer ma boutique
                </Link>
              </>
            )}
          </div>

          {/* Menu burger mobile */}
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
          <Link href="#boutiques" className="block text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>Boutiques</Link>
          <Link href="#faq" className="block text-muted hover:text-white transition-colors py-2" onClick={() => setMenuOuvert(false)}>FAQ</Link>

          <div className="pt-3 border-t border-border space-y-2">
            {isConnecte ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-center text-white py-2 font-medium"
                  onClick={() => setMenuOuvert(false)}
                >
                  Dashboard — {user?.name}
                </Link>
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