'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ConfirmerEmailClient() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token');

  const [statut,  setStatut]  = useState<'loading' | 'succes' | 'erreur'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatut('erreur');
      setMessage('Token manquant ou invalide.');
      return;
    }

    const confirmer = async () => {
      try {
        const res  = await fetch(
          `/backend/auth/confirm-email?token=${token}`
        );
        const data = await res.json();

        if (data.success) {
          setStatut('succes');
          setMessage(data.message);
          setTimeout(() => router.push('/connexion'), 3000);
        } else {
          setStatut('erreur');
          setMessage(data.message ?? 'Lien invalide ou expiré.');
        }
      } catch {
        setStatut('erreur');
        setMessage('Erreur serveur. Veuillez réessayer.');
      }
    };

    confirmer();
  }, [token]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center space-y-6">

        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <span className="text-white font-bold text-lg">
            Shop<span className="text-primary">Easy</span> CI
          </span>
        </div>

        {statut === 'loading' && (
          <div className="space-y-4">
            <Loader2 size={48} className="text-primary animate-spin mx-auto" />
            <p className="text-white font-semibold">Confirmation en cours...</p>
            <p className="text-muted text-sm">Veuillez patienter</p>
          </div>
        )}

        {statut === 'succes' && (
          <div className="space-y-4">
            <CheckCircle size={48} className="text-primary mx-auto" />
            <h1 className="text-white font-bold text-xl">Email confirmé ! 🎉</h1>
            <p className="text-muted text-sm">{message}</p>
            <p className="text-muted text-xs">Redirection dans 3 secondes...</p>
            <Link href="/connexion"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Se connecter maintenant →
            </Link>
          </div>
        )}

        {statut === 'erreur' && (
          <div className="space-y-4">
            <XCircle size={48} className="text-red-400 mx-auto" />
            <h1 className="text-white font-bold text-xl">Lien invalide</h1>
            <p className="text-muted text-sm">{message}</p>
            <Link href="/inscription"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Retour à l'inscription →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}