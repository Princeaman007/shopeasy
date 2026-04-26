import Link from 'next/link';
import { ArrowRight, ShoppingBag, Star, Users } from 'lucide-react';

// ─── Fetch stats dynamiques ───────────────────────────────────────────────────

async function fetchStats() {
  try {
    const res = await fetch(
      `/backend/admin/stats/public`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Hero() {
  const stats = await fetchStats();

  const totalBoutiques = stats?.totalBoutiques ?? 200;
  const totalCommandes = stats?.totalCommandes ?? 500;

  return (
    <section className="relative min-h-screen bg-bg flex items-center overflow-hidden">

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* ── Colonne gauche ── */}
          <div className="space-y-8">

            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-sm font-medium">
                Fait pour les vendeurs ivoiriens
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Votre boutique
                <br />
                <span className="text-primary">en ligne</span> en
                <br />
                quelques minutes
              </h1>
              <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-lg">
                Transformez votre activite Instagram, TikTok et Facebook en boutique professionnelle.
                Vos clients commandent, vous encaissez.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/inscription"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 text-lg">
                Creer ma boutique gratuitement
                <ArrowRight size={20} />
              </Link>
              <Link href="/themes"
                className="inline-flex items-center justify-center gap-2 bg-elevated hover:bg-border text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg border border-border">
                Voir les themes
              </Link>
            </div>

            {/* Preuve sociale dynamique */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}
                      className="w-8 h-8 rounded-full bg-elevated border-2 border-bg flex items-center justify-center text-xs font-bold text-primary">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted text-xs">
                    +{totalBoutiques} boutique{totalBoutiques > 1 ? 's' : ''} cree{totalBoutiques > 1 ? 'es' : 'e'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted text-sm">
                <ShoppingBag size={16} className="text-primary" />
                <span>7 jours d'essai gratuit</span>
              </div>

              <div className="flex items-center gap-2 text-muted text-sm">
                <Users size={16} className="text-primary" />
                <span>Sans carte bancaire</span>
              </div>
            </div>
          </div>

          {/* ── Colonne droite — Mockup ── */}
          <div className="relative hidden lg:block">
            <div className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">

              <div className="flex items-center gap-2 px-4 py-3 bg-elevated border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 bg-bg rounded-md px-3 py-1 text-muted text-xs text-center">
                  maboutique.shopeasyci.ci
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ShoppingBag size={24} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold">Aya Fashion</p>
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">Verifie</span>
                    </div>
                    <p className="text-muted text-xs">Abidjan, Cocody</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { nom: 'Robe Wax',  prix: '15 000', couleur: 'bg-purple-500/20' },
                    { nom: 'Sac Cuir',  prix: '25 000', couleur: 'bg-blue-500/20'   },
                    { nom: 'Sandales',  prix: '8 000',  couleur: 'bg-orange-500/20' },
                    { nom: 'Collier',   prix: '5 000',  couleur: 'bg-pink-500/20'   },
                    { nom: 'Bracelet',  prix: '3 500',  couleur: 'bg-green-500/20'  },
                    { nom: 'Foulard',   prix: '6 000',  couleur: 'bg-red-500/20'    },
                  ].map((produit, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border">
                      <div className={`h-16 ${produit.couleur} flex items-center justify-center`}>
                        <ShoppingBag size={20} className="text-white/50" />
                      </div>
                      <div className="p-2 bg-elevated">
                        <p className="text-white text-xs font-medium truncate">{produit.nom}</p>
                        <p className="text-primary text-xs font-bold">{produit.prix} F</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl py-2">
                  <span className="text-green-400 text-sm font-medium">Commander via WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Badge flottant — commandes */}
            <div className="absolute -top-4 -right-4 bg-surface border border-border rounded-xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Nouvelle commande !</p>
                  <p className="text-muted text-xs">
                    +{totalCommandes} commandes passees
                  </p>
                </div>
              </div>
            </div>

            {/* Badge flottant — boutiques */}
            <div className="absolute -bottom-4 -left-4 bg-surface border border-border rounded-xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">
                    {totalBoutiques} boutique{totalBoutiques > 1 ? 's' : ''} actives
                  </p>
                  <p className="text-primary text-xs">Cote d'Ivoire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}