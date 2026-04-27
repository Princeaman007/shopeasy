'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell, ExternalLink } from 'lucide-react';

export default function TopBar() {
  const { user, shop, logout } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">

      {/* Titre page */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-8" />
        {shop && (
          <Link
            href={`http://${slug}.shopeasyci.store`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-muted hover:text-primary transition-colors text-sm"
          >
            <ExternalLink size={14} />
            Voir ma boutique
          </Link>
        )}
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-elevated hover:bg-border border border-border flex items-center justify-center text-muted hover:text-white transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* Avatar utilisateur */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-sm font-medium">{user?.name}</p>
            <p className="text-muted text-xs">{user?.email}</p>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="w-9 h-9 rounded-xl bg-elevated hover:bg-red-500/10 border border-border hover:border-red-500/30 flex items-center justify-center text-muted hover:text-red-400 transition-colors"
          title="Déconnexion"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}