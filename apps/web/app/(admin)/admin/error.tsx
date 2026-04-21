'use client';

import { useEffect } from 'react';
import Link          from 'next/link';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur admin :', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">

        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20
                        flex items-center justify-center mx-auto">
          <AlertTriangle size={36} className="text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-white text-xl font-bold">
            Une erreur est survenue
          </h1>
          <p className="text-muted text-sm">
            {error.message ?? "Quelque chose s'est mal passé."}
          </p>
          {error.digest && (
            <p className="text-muted text-xs font-mono">
              Code : {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3
                       rounded-xl bg-primary hover:bg-primary-hover text-white
                       font-semibold text-sm transition-colors"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 px-6 py-3
                       rounded-xl border border-border text-muted hover:text-white
                       font-semibold text-sm transition-colors"
          >
            <Shield size={16} />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}