'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

interface Adresse {
  _id?: string;
  label: string;
  address: string;
  city: string;
  phone: string;
}

const fmt = (s: string) => s.trim();

export default function MesAdressesPage() {
  const [adresses, setAdresses]         = useState<Adresse[]>([]);
  const [chargement, setChargement]     = useState(true);
  const [formulaire, setFormulaire]     = useState(false);
  const [enEdition, setEnEdition]       = useState<string | null>(null);
  const [erreur, setErreur]             = useState('');
  const [form, setForm]                 = useState<Adresse>({
    label: '', address: '', city: '', phone: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ── Chargement ──────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `/api/users/adresses`,
          { credentials: 'include', headers }
        );
        const data = await res.json();
        setAdresses(data.adresses || []);
      } catch {
        setErreur('Impossible de charger vos adresses');
      } finally {
        setChargement(false);
      }
    };
    fetch_();
  }, []);

  // ── Ajouter / Modifier ──────────────────────────────────────
  const sauvegarder = async () => {
    if (!form.label || !form.address || !form.city || !form.phone) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }
    setErreur('');
    try {
      if (enEdition) {
        const res = await fetch(
          `/api/users/adresses/${enEdition}`,
          { method: 'PUT', credentials: 'include', headers, body: JSON.stringify(form) }
        );
        const data = await res.json();
        setAdresses(data.adresses || []);
      } else {
        const res = await fetch(
          `/api/users/adresses`,
          { method: 'POST', credentials: 'include', headers, body: JSON.stringify(form) }
        );
        const data = await res.json();
        setAdresses(data.adresses || []);
      }
      setFormulaire(false);
      setEnEdition(null);
      setForm({ label: '', address: '', city: '', phone: '' });
    } catch {
      setErreur('Erreur lors de la sauvegarde');
    }
  };

  // ── Supprimer ───────────────────────────────────────────────
  const supprimer = async (id: string) => {
    try {
      const res = await fetch(
        `/api/users/adresses/${id}`,
        { method: 'DELETE', credentials: 'include', headers }
      );
      const data = await res.json();
      setAdresses(data.adresses || []);
    } catch {
      setErreur('Erreur lors de la suppression');
    }
  };

  // ── Ouvrir édition ──────────────────────────────────────────
  const ouvrirEdition = (adresse: Adresse) => {
    setForm(adresse);
    setEnEdition(adresse._id || null);
    setFormulaire(true);
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Mes adresses</h1>
                <p className="text-muted text-sm">{adresses.length} adresse{adresses.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {!formulaire && (
              <button
                onClick={() => { setFormulaire(true); setEnEdition(null); setForm({ label: '', address: '', city: '', phone: '' }); }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Plus size={16} /> Ajouter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {/* Erreur */}
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{erreur}</div>
        )}

        {/* Formulaire ajout/édition */}
        {formulaire && (
          <div className="bg-surface border border-primary/30 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-semibold">
              {enEdition ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-muted text-xs uppercase tracking-wide">Libellé</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Maison, Bureau..."
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted text-xs uppercase tracking-wide">Téléphone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0700000000"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-muted text-xs uppercase tracking-wide">Adresse</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Rue, quartier..."
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted text-xs uppercase tracking-wide">Ville</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Abidjan, Bouaké..."
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={sauvegarder}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Check size={16} /> Sauvegarder
              </button>
              <button
                onClick={() => { setFormulaire(false); setEnEdition(null); setErreur(''); }}
                className="inline-flex items-center gap-2 bg-elevated hover:bg-border border border-border text-muted hover:text-white px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <X size={16} /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Vide */}
        {!formulaire && adresses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <MapPin size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucune adresse</h2>
            <p className="text-muted text-sm mb-6">Ajoutez une adresse pour accélérer vos prochaines commandes</p>
            <button
              onClick={() => setFormulaire(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={16} /> Ajouter une adresse
            </button>
          </div>
        )}

        {/* Liste adresses */}
        {adresses.map((adresse) => (
          <div key={adresse._id} className="bg-surface border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold">{adresse.label}</p>
                <p className="text-muted text-sm mt-0.5">{adresse.address}</p>
                <p className="text-muted text-sm">{adresse.city}</p>
                <p className="text-muted text-sm">{adresse.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => ouvrirEdition(adresse)}
                className="w-8 h-8 rounded-xl bg-elevated hover:bg-border border border-border flex items-center justify-center text-muted hover:text-white transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => supprimer(adresse._id!)}
                className="w-8 h-8 rounded-xl bg-elevated hover:bg-red-500/10 border border-border hover:border-red-500/30 flex items-center justify-center text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}