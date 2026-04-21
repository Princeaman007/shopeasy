'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ShoppingBag, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Schéma de validation ─────────────────────────────────────────────────────

const connexionSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type ConnexionForm = z.infer<typeof connexionSchema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ConnexionPage() {
  const { login } = useAuth();
  const [showPassword,  setShowPassword]  = useState(false);
  const [erreurServeur, setErreurServeur] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnexionForm>({
    resolver: zodResolver(connexionSchema),
  });

  const onSubmit = async (data: ConnexionForm) => {
    setErreurServeur('');
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
        setErreurServeur(result.message ?? 'Email ou mot de passe incorrect');
        return;
      }

      // 1. Sauvegarde directe dans localStorage
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user',  JSON.stringify(result.data.user));
      if (result.data.shop) {
        localStorage.setItem('shop', JSON.stringify(result.data.shop));
      }

      // 2. Cookie pour le middleware Next.js
      document.cookie = `token=${result.data.token}; path=/; max-age=604800`;

      // 3. Sauvegarde via le contexte auth
      login(
        result.data.token,
        result.data.user,
        result.data.shop ?? undefined,
      );

      // 4. Attends que tout soit bien sauvegardé
      await new Promise(resolve => setTimeout(resolve, 100));

      // 5. Redirige avec rechargement complet
      const role = result.data.user.role;
      if (role === 'admin') {
        window.location.href = '/admin';
      } else if (role === 'merchant') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/mes-commandes';
      }
    } catch {
      setErreurServeur('Erreur réseau — vérifiez votre connexion');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center
                            justify-center">
              <ShoppingBag size={22} className="text-black" />
            </div>
            <span className="text-white font-bold text-2xl">
              Shop<span className="text-primary">Easy</span> CI
            </span>
          </Link>
          <h1 className="text-white font-bold text-2xl mt-6">Bon retour ! 👋</h1>
          <p className="text-muted mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-2xl p-8 space-y-5"
        >
          {/* Erreur serveur */}
          {erreurServeur && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl
                            px-4 py-3">
              <p className="text-red-400 text-sm">{erreurServeur}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="votre@email.com"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                         text-white placeholder-muted focus:outline-none
                         focus:border-primary transition-colors"
            />
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm font-medium">
                Mot de passe
              </label>
              <Link
                href="/mot-de-passe-oublie"
                className="text-primary text-xs hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                           text-white placeholder-muted focus:outline-none
                           focus:border-primary transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted
                           hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50
                       text-black font-bold py-3 rounded-xl transition-colors
                       flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <Loader2 size={18} className="animate-spin" />
              : 'Se connecter'
            }
          </button>

          {/* Lien inscription */}
          <p className="text-center text-muted text-sm">
            Pas encore de compte ?{' '}
            <Link href="/inscription"
                  className="text-primary hover:underline font-medium">
              Créer une boutique
            </Link>
          </p>
        </form>

        {/* CGU */}
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