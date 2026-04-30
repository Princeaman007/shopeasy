'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import Image from 'next/image';

const schema = z.object({
  name:            z.string().min(2, 'Nom trop court'),
  email:           z.string().email('Email invalide'),
  phone:           z.string().min(8, 'Telephone invalide'),
  password:        z.string().min(6, 'Minimum 6 caracteres'),
  confirmPassword: z.string().min(6, 'Minimum 6 caracteres'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path:    ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

export default function InscriptionClientPage() {
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [erreurServeur,       setErreurServeur]       = useState('');
  const [emailEnvoye,         setEmailEnvoye]         = useState('');

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
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     data.name,
            email:    data.email,
            phone:    data.phone,
            password: data.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErreurServeur(result.message ?? "Erreur lors de l'inscription");
        return;
      }

      setEmailEnvoye(data.email);
    } catch {
      setErreurServeur('Erreur réseau — vérifiez votre connexion');
    }
  };

  // ── Page succès email envoyé ──
  if (emailEnvoye) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 text-center space-y-6">

          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Mail size={32} className="text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-white font-bold text-2xl">Verifiez votre email !</h1>
            <p className="text-muted text-sm">Un email de confirmation a ete envoye a</p>
            <p className="text-primary font-semibold">{emailEnvoye}</p>
          </div>

          <div className="bg-elevated border border-border rounded-xl p-4 text-left space-y-2">
            <p className="text-white text-sm font-medium">Comment confirmer ?</p>
            <ol className="text-muted text-xs space-y-1 list-decimal list-inside">
              <li>Ouvrez votre boite email</li>
              <li>Cherchez un email de ShopEasy CI</li>
              <li>Cliquez sur "Confirmer mon email"</li>
              <li>Connectez-vous a votre compte</li>
            </ol>
          </div>

          <p className="text-muted text-xs">
            Pas recu l'email ?{' '}
            <button
              onClick={async () => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-confirmation`, {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({ email: emailEnvoye }),
                });
              }}
              className="text-primary hover:underline font-medium">
              Renvoyer
            </button>
          </p>

          <Link href="/connexion"
            className="inline-flex items-center gap-2 text-muted hover:text-white text-sm transition-colors">
            ← Aller a la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/Shop.png" alt="ShopEasy CI" width={150} height={55} className="object-contain" />
          </Link>
          <h1 className="text-white font-bold text-2xl mt-6">Creer un compte</h1>
          <p className="text-muted mt-2">Pour suivre vos commandes facilement</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-2xl p-8 space-y-5">

          {erreurServeur && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{erreurServeur}</p>
            </div>
          )}

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Prenom et nom</label>
            <input {...register('name')} type="text" placeholder="Kouame Aya"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors" />
            {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Email</label>
            <input {...register('email')} type="email" placeholder="votre@email.com"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors" />
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          {/* Telephone */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Telephone</label>
            <input {...register('phone')} type="tel" placeholder="0700000000"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors" />
            {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <input {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 caracteres"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          {/* Confirmer mot de passe */}
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Confirmer le mot de passe</label>
            <div className="relative">
              <input {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repetez votre mot de passe"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors pr-12" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {isSubmitting
              ? <Loader2 size={18} className="animate-spin" />
              : 'Creer mon compte'
            }
          </button>

          <p className="text-center text-muted text-sm">
            Deja un compte ?{' '}
            <Link href="/connexion" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </form>

        <p className="text-center text-muted text-xs mt-4">
          Vous etes vendeur ?{' '}
          <Link href="/inscription" className="text-primary hover:underline">
            Creer une boutique
          </Link>
        </p>
      </div>
    </div>
  );
}