'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Schéma ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:     z.string().min(2, 'Nom trop court'),
  email:    z.string().email('Email invalide'),
  phone:    z.string().min(8, 'Téléphone invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

type Form = z.infer<typeof schema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function InscriptionClientPage() {
  const router          = useRouter();
  const { login }       = useAuth();
  const [showPassword,  setShowPassword]  = useState(false);
  const [erreurServeur, setErreurServeur] = useState('');

  // Récupère le redirect URL si présent
  const redirectUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect') ?? '/'
: '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setErreurServeur('');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register-client`,
        {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErreurServeur(result.message ?? "Erreur lors de l'inscription");
        return;
      }

      login(result.data.token, result.data.user);
      router.push(redirectUrl);
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
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingBag size={22} className="text-black" />
            </div>
            <span className="text-white font-bold text-2xl">
              Shop<span className="text-primary">Easy</span> CI
            </span>
          </Link>
          <h1 className="text-white font-bold text-2xl mt-6">Créer un compte</h1>
          <p className="text-muted mt-2">Pour suivre vos commandes facilement</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-2xl p-8 space-y-5"
        >
          {erreurServeur && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{erreurServeur}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Prénom et nom</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Kouamé Aya"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="votre@email.com"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Téléphone</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="0700000000"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
            {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 caractères"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Créer mon compte'
            )}
          </button>

          <p className="text-center text-muted text-sm">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </form>

        <p className="text-center text-muted text-xs mt-4">
          Vous êtes vendeur ?{' '}
          <Link href="/inscription" className="text-primary hover:underline">
            Créer une boutique
          </Link>
        </p>
      </div>
    </div>
  );
}