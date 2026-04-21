import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">

        {/* Icône */}
        <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20
                        flex items-center justify-center mx-auto">
          <Shield size={40} className="text-primary" />
        </div>

        {/* Texte */}
        <div className="space-y-2">
          <p className="text-muted text-sm font-mono">404</p>
          <h1 className="text-white text-2xl font-bold">
            Page introuvable
          </h1>
          <p className="text-muted">
            Cette page n'existe pas dans l'administration.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 px-6 py-3
                       rounded-xl bg-primary hover:bg-primary-hover text-white
                       font-semibold text-sm transition-colors"
          >
            <Shield size={16} />
            Tableau de bord
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3
                       rounded-xl border border-border text-muted hover:text-white
                       font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}