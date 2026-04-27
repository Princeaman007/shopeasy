'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ShoppingBag, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const connexionSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type ConnexionForm = z.infer<typeof connexionSchema>;

export default function ConnexionPage() {
  const { login }                                     = useAuth();
  const [showPassword,    setShowPassword]            = useState(false);
  const [erreurServeur,   setErreurServeur]           = useState('');
  const [emailNonVerifie, setEmailNonVerifie]         = useState('');
  const [renvoyeSucces,   setRenvoyeSucces]           = useState(false);
  const [renvoyeLoading,  setRenvoyeLoading]          = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ConnexionForm>({
    resolver: zodResolver(connexionSchema),
  });

  const onSubmit = async (data: ConnexionForm) => {
    setErreurServeur('');
    setEmailNonVerifie('');
    setRenvoyeSucces(false);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Cas email non verifie
        if (result.code === 'EMAIL_NOT_VERIFIED') {
          setEmailNonVerifie(data.email);
          return;
        }
        setErreurServeur(result.message ?? 'Email ou mot de passe incorrect');
        return;
      }

      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user',  JSON.stringify(result.data.user));
      if (result.data.shop) {
        localStorage.setItem('shop', JSON.stringify(result.data.shop));
      }
      document.cookie = `token=${result.data.token}; path=/; max-age=604800`;

      login(result.data.token, result.data.user, result.data.shop ?? undefined);
      await new Promise(resolve => setTimeout(resolve, 100));

      const role = result.data.user.role;
        if (role === 'admin')              window.location.href = '/admin';
        else if (role === 'merchant')      window.location.href = '/dashboard';
        else if (result.data.shop)         window.location.href = '/dashboard';
        else                               window.location.href = '/mes-commandes';                         window.location.href = '/mes-commandes';
    } catch {
      setErreurServeur('Erreur réseau — vérifiez votre connexion');
    }
  };

  const renvoyer = async () => {
    setRenvoyeLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-confirmation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailNonVerifie }),
      });
      setRenvoyeSucces(true);
    } finally {
      setRenvoyeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingBag size={22} className="text-black" />
            </div>
            <span className="text-white font-bold text-2xl">
              Shop<span className="text-primary">Easy</span> CI
            </span>
          </Link>
          <h1 className="text-white font-bold text-2xl mt-6">Bon retour !</h1>
          <p className="text-muted mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* ── Bandeau email non verifie ── */}
        {emailNonVerifie && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mb-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-400 font-semibold text-sm">
                  Email non confirme
                </p>
                <p className="text-muted text-xs mt-0.5">
                  Verifiez votre boite email et cliquez sur le lien de confirmation.
                </p>
              </div>
            </div>

            {renvoyeSucces ? (
              <p className="text-green-400 text-xs text-center py-1">
                ✅ Nouveau lien envoye a {emailNonVerifie}
              </p>
            ) : (
              <button onClick={renvoyer} disabled={renvoyeLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {renvoyeLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Envoi...</>
                  : 'Renvoyer l\'email de confirmation'
                }
              </button>
            )}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-2xl p-8 space-y-5">

          {erreurServeur && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{erreurServeur}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Email</label>
            <input {...register('email')} type="email" placeholder="votre@email.com"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors" />
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm font-medium">Mot de passe</label>
              <Link href="/mot-de-passe-oublie" className="text-primary text-xs hover:underline">
                Mot de passe oublie ?
              </Link>
            </div>
            <div className="relative">
              <input {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          {/* Bouton connexion */}
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Se connecter'}
          </button>

          <div className="space-y-2 text-center">
            <p className="text-muted text-sm">
              Vendeur ?{' '}
              <Link href="/inscription" className="text-primary hover:underline font-medium">
                Créer une boutique
              </Link>
            </p>
            <p className="text-muted text-sm">
              Client ?{' '}
              <Link href="/inscription-client" className="text-primary hover:underline font-medium">
                Créer un compte client
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted text-xs">
            En vous connectant, vous acceptez nos{' '}
            <Link href="/cgu" className="text-primary hover:underline">
              conditions d'utilisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}