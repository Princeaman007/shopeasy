'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Boutique {
    selectedTheme: string;
    planType: 'basic' | 'premium';
}

// ---------------------------------------------------------------------------
// Données des thèmes
// ---------------------------------------------------------------------------
const THEMES = [
    {
        id: 'vitrine-moderne',
        nom: 'Vitrine Moderne',
        plan: 'basic' as const,
        description: 'Élégant, épuré, professionnel. Idéal pour la mode et les accessoires.',
        couleurs: ['#0f172a', '#10b981', '#f8fafc'],   // slate + emerald
        apercu: {
            bg: '#0f172a',
            accent: '#10b981',
            card: '#1e293b',
            texte: '#f8fafc',
        },
    },
    {
        id: 'marche-colore',
        nom: 'Marché Coloré',
        plan: 'basic' as const,
        description: "Chaleureux et vivant. Parfait pour l'alimentation et l'artisanat.",
        couleurs: ['#1c1917', '#f59e0b', '#fafaf9'],   // stone + amber
        apercu: {
            bg: '#1c1917',
            accent: '#f59e0b',
            card: '#292524',
            texte: '#fafaf9',
        },
    },
    {
        id: 'luxe-sombre',
        nom: 'Luxe Sombre',
        plan: 'premium' as const,
        description: 'Sophistiqué et haut de gamme. Pour la bijouterie et le luxe.',
        couleurs: ['#0c0a09', '#d97706', '#fafaf9'],   // stone-950 + amber
        apercu: {
            bg: '#0c0a09',
            accent: '#d97706',
            card: '#1c1917',
            texte: '#fafaf9',
        },
    },
    {
        id: 'boutique-pro',
        nom: 'Boutique Pro',
        plan: 'premium' as const,
        description: 'Clair, moderne et aéré. Idéal pour la beauté et la cosmétique.',
        couleurs: ['#ffffff', '#0ea5e9', '#0f172a'],   // white + sky
        apercu: {
            bg: '#f0f9ff',
            accent: '#0ea5e9',
            card: '#ffffff',
            texte: '#0f172a',
        },
    },
    {
        id: 'stories-style',
        nom: 'Stories Style',
        plan: 'premium' as const,
        description: 'Tendance et coloré. Inspiré des réseaux sociaux, pour les jeunes marques.',
        couleurs: ['#18181b', '#8b5cf6', '#fafafa'],   // zinc + violet
        apercu: {
            bg: '#18181b',
            accent: '#8b5cf6',
            card: '#27272a',
            texte: '#fafafa',
        },
    },
];

// ---------------------------------------------------------------------------
// Composant carte aperçu d'un thème
// ---------------------------------------------------------------------------
function CarteTheme({
    theme,
    actif,
    bloque,
    onChoisir,
    loading,
}: {
    theme: typeof THEMES[0];
    actif: boolean;
    bloque: boolean;
    onChoisir: () => void;
    loading: boolean;
}) {
    const { apercu } = theme;

    return (
        <div
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200
                  ${actif
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : bloque
                        ? 'border-border opacity-60'
                        : 'border-border hover:border-primary/50 cursor-pointer'}`}
            onClick={() => !bloque && !actif && onChoisir()}
        >
            {/* Badge actif */}
            {actif && (
                <div className="absolute top-3 right-3 z-10 bg-primary text-white text-xs
                        font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check size={11} />
                    Actif
                </div>
            )}

            {/* Badge Premium */}
            {theme.plan === 'premium' && (
                <div className="absolute top-3 left-3 z-10 bg-amber-500/90 text-black text-xs
                        font-bold px-2.5 py-1 rounded-full">
                    PREMIUM
                </div>
            )}

            {/* Badge verrouillé */}
            {bloque && (
                <div className="absolute inset-0 z-10 flex items-center justify-center
                        bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <Lock size={24} />
                        <span className="text-sm font-medium">Premium requis</span>
                    </div>
                </div>
            )}

            {/* ── Aperçu miniature du thème ── */}
            <div
                className="h-44 p-3 flex flex-col gap-2"
                style={{ backgroundColor: apercu.bg }}
            >
                {/* Barre de navigation fictive */}
                <div
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: apercu.card }}
                >
                    <div className="w-16 h-2 rounded-full" style={{ backgroundColor: apercu.accent }} />
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-1.5 rounded-full opacity-50"
                                style={{ backgroundColor: apercu.texte }} />
                        ))}
                    </div>
                </div>

                {/* Grille produits fictive */}
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div
                            key={i}
                            className="rounded-lg flex flex-col justify-end p-1.5 gap-1"
                            style={{ backgroundColor: apercu.card }}
                        >
                            <div className="w-full h-1.5 rounded-full opacity-60"
                                style={{ backgroundColor: apercu.texte }} />
                            <div className="w-2/3 h-1 rounded-full opacity-40"
                                style={{ backgroundColor: apercu.texte }} />
                            <div className="w-1/2 h-1.5 rounded-full"
                                style={{ backgroundColor: apercu.accent }} />
                        </div>
                    ))}
                </div>

                {/* Bouton CTA fictif */}
                <div
                    className="w-full py-1.5 rounded-lg text-center"
                    style={{ backgroundColor: apercu.accent }}
                >
                    <div className="w-16 h-1.5 rounded-full mx-auto opacity-80"
                        style={{ backgroundColor: apercu.bg }} />
                </div>
            </div>

            {/* ── Infos thème ── */}
            <div className="p-4 bg-surface space-y-3">
                {/* Palette couleurs */}
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">{theme.nom}</h3>
                    <div className="flex gap-1">
                        {theme.couleurs.map((c, i) => (
                            <div
                                key={i}
                                className="w-5 h-5 rounded-full border border-border"
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <p className="text-muted text-xs leading-relaxed">{theme.description}</p>

                {/* Bouton choisir */}
                {!bloque && (
                    <button
                        onClick={e => { e.stopPropagation(); onChoisir(); }}
                        disabled={actif || loading}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                        flex items-center justify-center gap-2
                        ${actif
                                ? 'bg-primary/20 text-primary cursor-default'
                                : 'bg-primary hover:bg-primary-hover text-white'}`}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {actif ? '✓ Thème actuel' : 'Choisir ce thème'}
                    </button>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PageThemes() {
    const [boutique, setBoutique] = useState<Boutique | null>(null);
    const [chargement, setChargement] = useState(true);
    const [themeLoading, setThemeLoading] = useState<string | null>(null);
    const [succes, setSucces] = useState('');

    const API = process.env.NEXT_PUBLIC_API_URL;

    // -- Chargement boutique --
    useEffect(() => {
        const charger = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/shops/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setBoutique(data.data);
            } finally {
                setChargement(false);
            }
        };
        charger();
    }, []);

    // -- Changer de thème --
    const choisirTheme = async (themeId: string) => {
        setThemeLoading(themeId);
        setSucces('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/shops/me/theme`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ selectedTheme: themeId }),
            });
            const data = await res.json();
            if (data.success) {
                setBoutique(prev => prev ? { ...prev, selectedTheme: themeId } : prev);
                setSucces(`Thème "${THEMES.find(t => t.id === themeId)?.nom}" appliqué avec succès !`);
                setTimeout(() => setSucces(''), 3000);
            }
        } finally {
            setThemeLoading(null);
        }
    };

    // -- Thèmes disponibles selon le plan --
    const themesBasic = THEMES.filter(t => t.plan === 'basic');
    const themesPremium = THEMES.filter(t => t.plan === 'premium');
    const estPremium = boutique?.planType === 'premium';

    // ---------------------------------------------------------------------------
    if (chargement) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-8">

            {/* En-tête */}
            <div>
                <h1 className="text-white text-2xl font-bold">Thèmes</h1>
                <p className="text-muted text-sm mt-1">
                    Choisis l'apparence de ta boutique en ligne
                </p>
            </div>

            {/* Notification succès */}
            {succes && (
                <div className="bg-primary/10 border border-primary/30 text-primary
                        px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                    <Check size={16} />
                    {succes}
                </div>
            )}

            {/* Thèmes Basic */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-semibold">Thèmes Basic</h2>
                    <span className="text-xs text-muted bg-elevated border border-border
                           px-2 py-0.5 rounded-full">
                        Inclus dans tous les plans
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {themesBasic.map(theme => (
                        <CarteTheme
                            key={theme.id}
                            theme={theme}
                            actif={boutique?.selectedTheme === theme.id}
                            bloque={false}
                            loading={themeLoading === theme.id}
                            onChoisir={() => choisirTheme(theme.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Thèmes Premium */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-semibold">Thèmes Premium</h2>
                    {!estPremium && (
                        <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30
                             px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock size={10} />
                            Passe en Premium pour débloquer
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themesPremium.map(theme => (
                        <CarteTheme
                            key={theme.id}
                            theme={theme}
                            actif={boutique?.selectedTheme === theme.id}
                            bloque={!estPremium}
                            loading={themeLoading === theme.id}
                            onChoisir={() => choisirTheme(theme.id)}
                        />
                    ))}
                </div>

                {/* Bannière upgrade */}
                {!estPremium && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5
                          border border-amber-500/20 rounded-2xl p-5
                          flex items-center justify-between gap-4">
                        <div>
                            <p className="text-white font-semibold">Passe en Premium</p>
                            <p className="text-muted text-sm mt-0.5">
                                Débloque 3 thèmes exclusifs + analytics + codes promo + SMS
                            </p>
                        </div>
                        <Link
                            href="/dashboard/parametres/abonnement"
                            className="flex-shrink-0 bg-amber-500 hover:bg-amber-400
             text-black font-bold px-4 py-2.5 rounded-xl
             text-sm transition-colors"
                        >
                            Upgrader →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}