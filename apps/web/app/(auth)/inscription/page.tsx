'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Schéma de validation ─────────────────────────────────────────────────────

const inscriptionSchema = z.object({
  name:     z.string().min(2, 'Nom trop court'),
  email:    z.string().email('Email invalide'),
  phone:    z.string().min(8, 'Téléphone invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  shopName: z.string().min(2, 'Nom de boutique trop court').max(60),
  shopSlug: z.string()
    .min(2, 'Trop court')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Uniquement lettres minuscules, chiffres et tirets'),
  whatsapp: z.string().min(8, 'Numéro WhatsApp invalide'),
});

type InscriptionForm = z.infer<typeof inscriptionSchema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function InscriptionPage() {
  const router                          = useRouter();
  const { login }                       = useAuth();
  const [showPassword,  setShowPassword]  = useState(false);
  const [erreurServeur, setErreurServeur] = useState('');
  const [etape,         setEtape]         = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionForm>({
    resolver: zodResolver(inscriptionSchema),
  });

  /**
   * Génère automatiquement le slug depuis le nom de boutique
   */
  const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nom  = e.target.value;
    const slug = nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setValue('shopSlug', slug);
  };

  /**
   * Soumission du formulaire
   */
  const onSubmit = async (data: InscriptionForm) => {
    setErreurServeur('');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
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

      // Sauvegarde via le contexte auth
      login(
        result.data.token,
        result.data.user,
        result.data.shop,
      );

      // Redirige vers le dashboard
      router.push('/dashboard');
    } catch {
      setErreurServeur('Erreur réseau — vérifiez votre connexion');
    }
  };

  const shopSlug = watch('shopSlug', '');

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

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
          <p className="text-muted mt-2">Créez votre boutique en ligne gratuitement</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium ${etape === 1 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              etape === 1 ? 'bg-primary text-black' : 'bg-elevated text-muted'
            }`}>1</div>
            Votre compte
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 text-sm font-medium ${etape === 2 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              etape === 2 ? 'bg-primary text-black' : 'bg-elevated text-muted'
            }`}>2</div>
            Votre boutique
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border rounded-2xl p-8 space-y-5">

          {/* Erreur serveur */}
          {erreurServeur && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{erreurServeur}</p>
            </div>
          )}

          {/* ── Étape 1 — Infos personnelles ── */}
          {etape === 1 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-xl">Vos informations</h2>

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
                type="button"
                onClick={() => setEtape(2)}
                className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Étape 2 — Infos boutique ── */}
          {etape === 2 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-xl">Votre boutique</h2>

              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">Nom de la boutique</label>
                <input
                  {...register('shopName')}
                  type="text"
                  placeholder="Aya Fashion"
                  onChange={(e) => {
                    register('shopName').onChange(e);
                    handleShopNameChange(e);
                  }}
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
                {errors.shopName && <p className="text-red-400 text-xs">{errors.shopName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">URL de votre boutique</label>
                <div className="flex items-center bg-elevated border border-border rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                  <span className="text-muted text-sm px-3 py-3 border-r border-border bg-bg whitespace-nowrap">
                    shopeasyci.ci/
                  </span>
                  <input
                    {...register('shopSlug')}
                    type="text"
                    placeholder="aya-fashion"
                    className="flex-1 bg-transparent px-3 py-3 text-white placeholder-muted focus:outline-none text-sm"
                  />
                </div>
                {shopSlug && (
                  <p className="text-primary text-xs">
                    ✓ Votre boutique : {shopSlug}.shopeasyci.ci
                  </p>
                )}
                {errors.shopSlug && <p className="text-red-400 text-xs">{errors.shopSlug.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">Numéro WhatsApp</label>
                <input
                  {...register('whatsapp')}
                  type="tel"
                  placeholder="2250700000000"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-muted text-xs">Format international — ex: 2250700000000</p>
                {errors.whatsapp && <p className="text-red-400 text-xs">{errors.whatsapp.message}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEtape(1)}
                  className="flex-1 bg-elevated hover:bg-border text-white font-semibold py-3 rounded-xl transition-colors border border-border"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>Créer ma boutique</>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-muted text-sm">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-muted text-xs">
          <span>✅ 7 jours gratuits</span>
          <span>✅ Sans carte bancaire</span>
          <span>✅ Annulation à tout moment</span>
        </div>
      </div>
    </div>
  );
}