import Link from 'next/link';
import { Lock, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">

        <div className="w-24 h-24 rounded-2xl bg-red-500/10 border border-red-500/20
                        flex items-center justify-center mx-auto">
          <Lock size={40} className="text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-white text-2xl font-bold">
            Accès refusé
          </h1>
          <p className="text-muted">
            Tu n'as pas les permissions nécessaires pour accéder
            à cette section.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/connexion"
            className="flex items-center justify-center gap-2 px-6 py-3
                       rounded-xl bg-primary hover:bg-primary-hover text-white
                       font-semibold text-sm transition-colors"
          >
            <LogIn size={16} />
            Se connecter
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3
                       rounded-xl border border-border text-muted hover:text-white
                       font-semibold text-sm transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}