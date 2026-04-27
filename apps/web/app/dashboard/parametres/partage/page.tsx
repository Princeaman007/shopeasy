'use client';

import { useState, useEffect } from 'react';
import * as QRCodeLib from 'qrcode';
import Link from 'next/link';
import {
    Loader2, Copy, Check, Download, Share2,
    ExternalLink, MessageCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

// ---------------------------------------------------------------------------
function LignePartage({
    icone, nom, couleur, message, onClick,
}: {
    icone: React.ReactNode;
    nom: string;
    couleur: string;
    message: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 w-full p-4 bg-elevated border border-border
                 rounded-xl hover:border-primary/30 transition-colors text-left group"
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${couleur}20`, color: couleur }}
            >
                {icone}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{nom}</p>
                <p className="text-muted text-xs truncate">{message}</p>
            </div>
            <ExternalLink
                size={15}
                className="text-muted group-hover:text-white transition-colors flex-shrink-0"
            />
        </button>
    );
}

// ---------------------------------------------------------------------------
export default function PagePartage() {
    const [slug, setSlug] = useState('');
    const [nomShop, setNomShop] = useState('');
    const [chargement, setChargement] = useState(true);
    const [copieLien, setCopieLien] = useState(false);
    const [copieSlug, setCopieSlug] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');

    const urlBoutique = `https://${slug}.shopeasyci.store`;

    // -- Chargement --
    useEffect(() => {
        const charger = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/shops/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    setSlug(data.data.slug ?? '');
                    setNomShop(data.data.name ?? '');
                }
            } finally {
                setChargement(false);
            }
        };
        charger();
    }, []);

    // -- Génération QR code dès que le slug est disponible --
    useEffect(() => {
        if (!slug) return;
        QRCodeLib.toDataURL(urlBoutique, {
            width: 220,
            margin: 2,
            color: { dark: '#141414', light: '#ffffff' },
        }).then(setQrDataUrl);
    }, [slug]);

    // -- Copier lien --
    const copierLien = async () => {
        await navigator.clipboard.writeText(urlBoutique);
        setCopieLien(true);
        setTimeout(() => setCopieLien(false), 2000);
    };

    // -- Copier slug --
    const copierSlug = async () => {
        await navigator.clipboard.writeText(slug);
        setCopieSlug(true);
        setTimeout(() => setCopieSlug(false), 2000);
    };

    // -- Télécharger QR code --
    const telechargerQR = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.download = `qr-${slug}.png`;
        link.href = qrDataUrl;
        link.click();
    };

    // -- Messages partage --
    const msgWhatsApp = encodeURIComponent(
        `Découvrez ma boutique en ligne "${nomShop}" \n${urlBoutique}`
    );
    const msgInstagram = `Découvrez ma boutique en ligne "${nomShop}"  ${urlBoutique}`;
    const msgTikTok = `Boutique en ligne : ${urlBoutique} `;
    const msgFacebook = encodeURIComponent(urlBoutique);

    const partagerWhatsApp = () => window.open(`https://wa.me/?text=${msgWhatsApp}`, '_blank');
    const partagerInstagram = () => {
        navigator.clipboard.writeText(msgInstagram);
        alert("Lien copié ! Colle-le dans ta bio ou ta story Instagram ");
    };
    const partagerTikTok = () => {
        navigator.clipboard.writeText(msgTikTok);
        alert("Lien copié ! Colle-le dans ta bio TikTok 🎵");
    };
    const partagerFacebook = () =>
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${msgFacebook}`, '_blank');

    // ---------------------------------------------------------------------------
    if (chargement) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">

            {/* En-tête */}
            <div>
                <h1 className="text-white text-2xl font-bold">Partager ma boutique</h1>
                <p className="text-muted text-sm mt-1">
                    Partage ton lien et ton QR code pour attirer plus de clients
                </p>
            </div>

            {/* ── Lien boutique ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <ExternalLink size={18} className="text-primary" />
                    Lien de ta boutique
                </h2>

                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-elevated border border-border rounded-xl
                          px-4 py-3 flex items-center gap-2 min-w-0">
                        <span className="text-primary text-sm font-medium truncate">
                            {urlBoutique}
                        </span>
                    </div>
                    <button
                        onClick={copierLien}
                        className="flex-shrink-0 flex items-center gap-2 bg-primary hover:bg-primary-hover
                       text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    >
                        {copieLien
                            ? <><Check size={15} /> Copié !</>
                            : <><Copy size={15} /> Copier</>
                        }
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-elevated
                        rounded-xl border border-border">
                    <div>
                        <p className="text-muted text-xs">Identifiant de ta boutique</p>
                        <p className="text-white text-sm font-mono mt-0.5">{slug}</p>
                    </div>
                    <button
                        onClick={copierSlug}
                        className="text-muted hover:text-white transition-colors p-2"
                    >
                        {copieSlug
                            ? <Check size={15} className="text-primary" />
                            : <Copy size={15} />
                        }
                    </button>
                </div>

                <Link
                    href={urlBoutique}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     border border-border text-muted hover:text-white hover:border-white/30
                     text-sm transition-colors"
                >
                    <ExternalLink size={15} />
                    Ouvrir ma boutique
                </Link>
            </div>

            {/* ── QR Code ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <Share2 size={18} className="text-primary" />
                    QR Code
                </h2>

                <p className="text-muted text-sm">
                    Imprime ce QR code sur tes emballages, flyers ou stories pour que
                    tes clients accèdent directement à ta boutique.
                </p>

                <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-5 rounded-2xl">
                        {qrDataUrl
                            ? <img src={qrDataUrl} alt="QR Code boutique" width={220} height={220} />
                            : <div className="w-[220px] h-[220px] flex items-center justify-center">
                                <Loader2 size={24} className="animate-spin text-muted" />
                            </div>
                        }
                    </div>

                    <p className="text-muted text-xs">{urlBoutique}</p>

                    <button
                        onClick={telechargerQR}
                        disabled={!qrDataUrl}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover
                       text-white px-6 py-3 rounded-xl font-medium transition-colors
                       disabled:opacity-50"
                    >
                        <Download size={18} />
                        Télécharger le QR code
                    </button>
                </div>
            </div>

            {/* ── Partage réseaux sociaux ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <Share2 size={18} className="text-primary" />
                    Partager sur les réseaux
                </h2>

                <div className="space-y-3">
                    <LignePartage
                        icone={<MessageCircle size={20} />}
                        nom="WhatsApp"
                        couleur="#25D366"
                        message="Envoie ton lien en message WhatsApp"
                        onClick={partagerWhatsApp}
                    />
                    <LignePartage
                        icone={
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                        }
                        nom="Instagram"
                        couleur="#E1306C"
                        message="Copie le lien pour ta bio ou tes stories"
                        onClick={partagerInstagram}
                    />
                    <LignePartage
                        icone={
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5
                         2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01
                         a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34
                         6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0
                         01-1.01-.06z"/>
                            </svg>
                        }
                        nom="TikTok"
                        couleur="#010101"
                        message="Copie le lien pour ta bio TikTok"
                        onClick={partagerTikTok}
                    />
                    <LignePartage
                        icone={
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388
                         10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669
                         4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925
                         -1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062
                         24 12.073z"/>
                            </svg>
                        }
                        nom="Facebook"
                        couleur="#1877F2"
                        message="Partage ta boutique sur Facebook"
                        onClick={partagerFacebook}
                    />
                </div>
            </div>

            {/* ── Conseils ── */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
                <h3 className="text-primary font-semibold text-sm">
                    💡 Conseils pour plus de visibilité
                </h3>
                <ul className="space-y-2 text-muted text-sm">
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        Ajoute le lien de ta boutique dans la bio de tous tes réseaux sociaux
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        Imprime le QR code et colle-le sur tes emballages et sacs
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        Partage le lien dans tes stories à chaque nouveau produit
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        Envoie le QR code à tes clients WhatsApp réguliers
                    </li>
                </ul>
            </div>
        </div>
    );
}