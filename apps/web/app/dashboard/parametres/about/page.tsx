'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, Upload, X, User, MapPin, Clock, FileText } from 'lucide-react';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FormAbout {
  description:  string;
  ownerName:    string;
  ownerPhoto:   string;
  location:     string;
  workingHours: string;
}

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

// ---------------------------------------------------------------------------
export default function PageAbout() {
  const [form,          setForm]          = useState<FormAbout>({
    description:  '',
    ownerName:    '',
    ownerPhoto:   '',
    location:     '',
    workingHours: '',
  });
  const [photoPreview,  setPhotoPreview]  = useState('');
  const [photoFile,     setPhotoFile]     = useState<File | null>(null);
  const [chargement,    setChargement]    = useState(true);
  const [sauvegarde,    setSauvegarde]    = useState(false);
  const [succes,        setSucces]        = useState('');
  const [erreur,        setErreur]        = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // -- Chargement --
  useEffect(() => {
    const charger = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API}/shops/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data.about) {
          const a = data.data.about;
          setForm({
            description:  a.description  ?? '',
            ownerName:    a.ownerName    ?? '',
            ownerPhoto:   a.ownerPhoto   ?? '',
            location:     a.location     ?? '',
            workingHours: a.workingHours ?? '',
          });
          if (a.ownerPhoto) setPhotoPreview(a.ownerPhoto);
        }
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  // -- Sélection photo propriétaire --
  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErreur('La photo ne doit pas dépasser 2 Mo');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErreur('');
  };

  const supprimerPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setForm(prev => ({ ...prev, ownerPhoto: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  // -- Sauvegarde --
  const sauvegarder = async () => {
    setSauvegarde(true);
    setErreur('');
    setSucces('');

    try {
      const token = localStorage.getItem('token');

      // 1. Upload photo si nouveau fichier
      let ownerPhotoUrl = form.ownerPhoto;
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);

        const uploadRes = await fetch(`${API}/shops/me/owner-photo`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) ownerPhotoUrl = uploadData.url;
      }

      // 2. Sauvegarde about
      const res = await fetch(`${API}/shops/me/about`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          description:  form.description.trim(),
          ownerName:    form.ownerName.trim(),
          ownerPhoto:   ownerPhotoUrl,
          location:     form.location.trim(),
          workingHours: form.workingHours.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');

      setSucces('Page À propos sauvegardée !');
      setPhotoFile(null);
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setSauvegarde(false);
    }
  };

  // -- Compteur caractères description --
  const descMax = 500;

  // ---------------------------------------------------------------------------
  if (chargement) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-white text-2xl font-bold">Page À propos</h1>
        <p className="text-muted text-sm mt-1">
          Présente ta boutique et crée un lien de confiance avec tes clients
        </p>
      </div>

      {/* Notifications */}
      {succes && (
        <div className="bg-primary/10 border border-primary/30 text-primary
                        px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check size={16} />
          {succes}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400
                        px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      {/* ── Description boutique ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Description de la boutique
        </h2>

        <div className="space-y-1.5">
          <label className="text-muted text-sm">
            Décris ta boutique, ce que tu vends, ton histoire...
          </label>
          <textarea
            value={form.description}
            onChange={e => {
              if (e.target.value.length <= descMax)
                setForm(prev => ({ ...prev, description: e.target.value }));
            }}
            rows={5}
            placeholder="Ex : Boutique Aminata est spécialisée dans la mode féminine africaine moderne. Basée à Abidjan, nous proposons des tenues uniques alliant tradition et modernité..."
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary
                       resize-none leading-relaxed"
          />
          <p className="text-muted text-xs text-right">
            {form.description.length}/{descMax}
          </p>
        </div>
      </div>

      {/* ── Propriétaire ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <User size={18} className="text-primary" />
          Le/la propriétaire
        </h2>

        {/* Photo propriétaire */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-border
                          bg-elevated flex items-center justify-center flex-shrink-0
                          overflow-hidden relative">
            {photoPreview ? (
              <>
                <Image
                  src={photoPreview}
                  alt="Photo propriétaire"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={supprimerPhoto}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full
                             flex items-center justify-center text-white z-10"
                >
                  <X size={10} />
                </button>
              </>
            ) : (
              <User size={28} className="text-muted" />
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-elevated border border-border
                         hover:border-primary/50 text-white px-4 py-2 rounded-xl
                         text-sm transition-colors"
            >
              <Upload size={15} />
              {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            <p className="text-muted text-xs">PNG, JPG — max 2 Mo</p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPhotoChange}
          className="hidden"
        />

        {/* Nom propriétaire */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Nom du/de la propriétaire</label>
          <input
            value={form.ownerName}
            onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
            placeholder="Ex : Aminata Koné"
            maxLength={60}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* ── Localisation & Horaires ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          Localisation & Horaires
        </h2>

        {/* Localisation */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Localisation</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ex : Cocody, Abidjan"
              maxLength={100}
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4 py-3
                         text-white placeholder-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Horaires */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm flex items-center gap-1.5">
            <Clock size={13} />
            Horaires de disponibilité
          </label>
          <input
            value={form.workingHours}
            onChange={e => setForm(prev => ({ ...prev, workingHours: e.target.value }))}
            placeholder="Ex : Lun–Sam, 8h–20h | Livraison 24h/48h"
            maxLength={100}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary"
          />
          <p className="text-muted text-xs">
            Ces informations rassureront tes clients sur tes disponibilités
          </p>
        </div>
      </div>

      {/* ── Aperçu rapide ── */}
      {(form.description || form.ownerName || form.location) && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-white font-semibold text-sm">Aperçu</h2>
          <div className="bg-elevated rounded-xl p-4 space-y-3">
            {form.description && (
              <p className="text-muted text-sm leading-relaxed line-clamp-3">
                {form.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted">
              {form.ownerName && (
                <span className="flex items-center gap-1">
                  <User size={11} />
                  {form.ownerName}
                </span>
              )}
              {form.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {form.location}
                </span>
              )}
              {form.workingHours && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {form.workingHours}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bouton sauvegarder ── */}
      <button
        onClick={sauvegarder}
        disabled={sauvegarde}
        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white
                   font-semibold rounded-xl transition-colors disabled:opacity-50
                   flex items-center justify-center gap-2"
      >
        {sauvegarde && <Loader2 size={18} className="animate-spin" />}
        {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}