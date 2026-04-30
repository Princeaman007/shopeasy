'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';

// ─── Schémas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Email invalide'),
});

const resetSchema = z.object({
  password:        z.string().min(6, 'Minimum 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message:  'Les mots de passe ne correspondent pas',
  path:     ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function MotDePasseOubliePage() {
  const [etape, setEtape] = useState<'email' | 'succes' | 'reset'>('email');
  const [erreur, setErreur] = useState('');

  // Récupère le token depuis l'URL si présent
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null;

  // ── Formulaire email ──
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  // ── Formulaire reset ──
  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  /**
   * Demande de réinitialisation
   */
  const onEmailSubmit = async (data: EmailForm) => {
    setErreur('');
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: data.email }),
        }
      );
      // Toujours afficher le succès (sécurité)
      setEtape('succes');
    } catch {
      setErreur('Erreur réseau — vérifiez votre connexion');
    }
  };

  /**
   * Réinitialisation effective
   */
  const onResetSubmit = async (data: ResetForm) => {
    setErreur('');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token, password: data.password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErreur(result.message ?? 'Erreur lors de la réinitialisation');
        return;
      }

      setEtape('succes');
    } catch {
      setErreur('Erreur réseau — vérifiez votre connexion');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/Shop.png" alt="ShopEasy CI" width={150} height={55} className="object-contain" />
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">

          {/* ── Étape email ── */}
          {(etape === 'email' && !token) && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-white font-bold text-2xl">Mot de passe oublié ?</h1>
                <p className="text-muted text-sm">
                  Entrez votre email et nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              {erreur && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{erreur}</p>
                </div>
              )}

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-white text-sm font-medium">Email</label>
                  <input
                    {...emailForm.register('email')}
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-red-400 text-xs">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {emailForm.formState.isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Envoyer le lien'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Étape reset (token présent dans l'URL) ── */}
          {token && etape !== 'succes' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-white font-bold text-2xl">Nouveau mot de passe</h1>
                <p className="text-muted text-sm">
                  Choisissez un nouveau mot de passe sécurisé.
                </p>
              </div>

              {erreur && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{erreur}</p>
                </div>
              )}

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-white text-sm font-medium">Nouveau mot de passe</label>
                  <input
                    {...resetForm.register('password')}
                    type="password"
                    placeholder="Minimum 6 caractères"
                    className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {resetForm.formState.errors.password && (
                    <p className="text-red-400 text-xs">
                      {resetForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-white text-sm font-medium">Confirmer le mot de passe</label>
                  <input
                    {...resetForm.register('confirmPassword')}
                    type="password"
                    placeholder="Répétez le mot de passe"
                    className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-xs">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {resetForm.formState.isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Étape succès ── */}
          {etape === 'succes' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-white font-bold text-xl">
                  {token ? 'Mot de passe réinitialisé !' : 'Email envoyé !'}
                </h2>
                <p className="text-muted text-sm">
                  {token
                    ? 'Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.'
                    : 'Si cet email existe, vous recevrez un lien de réinitialisation dans quelques minutes.'}
                </p>
              </div>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Se connecter
              </Link>
            </div>
          )}

          {/* Retour connexion */}
          {etape === 'email' && !token && (
            <div className="mt-6 text-center">
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}