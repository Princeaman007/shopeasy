'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, Upload, X, Store, Phone, MessageCircle, Globe } from 'lucide-react';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FormBoutique {
  name:                 string;
  whatsapp:             string;
  whatsappOrderNotif:   boolean;
  logo?:                string;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PageParamsBoutique() {
  const [form,        setForm]        = useState<FormBoutique>({
    name:               '',
    whatsapp:           '',
    whatsappOrderNotif: true,
  });
  const [slug,        setSlug]        = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [chargement,  setChargement]  = useState(true);
  const [sauvegarde,  setSauvegarde]  = useState(false);
  const [succes,      setSucces]      = useState('');
  const [erreur,      setErreur]      = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // -- Chargement boutique --
  useEffect(() => {
    const charger = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API}/shops/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const b = data.data;
          setForm({
            name:               b.name               ?? '',
            whatsapp:           b.whatsapp            ?? '',
            whatsappOrderNotif: b.whatsappOrderNotif  ?? true,
            logo:               b.logo               ?? '',
          });
          setSlug(b.slug ?? '');
          if (b.logo) setLogoPreview(b.logo);
        }
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  // -- Sélection logo --
  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifie la taille (max 2 Mo)
    if (file.size > 2 * 1024 * 1024) {
      setErreur('Le logo ne doit pas dépasser 2 Mo');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErreur('');
  };

  const supprimerLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setForm(prev => ({ ...prev, logo: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  // -- Sauvegarde --
  const sauvegarder = async () => {
    if (!form.name.trim()) {
      setErreur('Le nom de la boutique est obligatoire');
      return;
    }

    // Validation WhatsApp (optionnel mais doit être un numéro valide)
    if (form.whatsapp && !/^\+?[0-9]{8,15}$/.test(form.whatsapp.replace(/\s/g, ''))) {
      setErreur('Numéro WhatsApp invalide (ex: +2250701020304)');
      return;
    }

    setSauvegarde(true);
    setErreur('');
    setSucces('');

    try {
      const token = localStorage.getItem('token');

      // 1. Upload logo si un nouveau fichier est sélectionné
      let logoUrl = form.logo ?? '';
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('type', 'logo');

        const uploadRes = await fetch(`${API}/shops/me/logo`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) logoUrl = uploadData.url;
      }

      // 2. Sauvegarde les paramètres
      const res = await fetch(`${API}/shops/me`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:               form.name.trim(),
          whatsapp:           form.whatsapp.trim(),
          whatsappOrderNotif: form.whatsappOrderNotif,
          logo:               logoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');

      setSucces('Paramètres sauvegardés avec succès !');
      setLogoFile(null);
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setSauvegarde(false);
    }
  };

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
        <h1 className="text-white text-2xl font-bold">Paramètres boutique</h1>
        <p className="text-muted text-sm mt-1">
          Personnalise les informations principales de ta boutique
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

      {/* ── Logo ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Store size={18} className="text-primary" />
          Logo de la boutique
        </h2>

        <div className="flex items-center gap-5">
          {/* Aperçu */}
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border
                          bg-elevated flex items-center justify-center flex-shrink-0
                          overflow-hidden relative">
            {logoPreview ? (
              <>
                <Image
                  src={logoPreview}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={supprimerLogo}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full
                             flex items-center justify-center text-white z-10"
                >
                  <X size={10} />
                </button>
              </>
            ) : (
              <Store size={28} className="text-muted" />
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-elevated border border-border
                         hover:border-primary/50 text-white px-4 py-2 rounded-xl
                         text-sm transition-colors"
            >
              <Upload size={15} />
              {logoPreview ? 'Changer le logo' : 'Uploader un logo'}
            </button>
            <p className="text-muted text-xs">
              PNG, JPG — max 2 Mo — recommandé 200×200px
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onLogoChange}
          className="hidden"
        />
      </div>

      {/* ── Informations générales ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          Informations générales
        </h2>

        {/* Nom de la boutique */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">
            Nom de la boutique <span className="text-red-400">*</span>
          </label>
          <input
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex : Boutique Aminata"
            maxLength={60}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* URL de la boutique (lecture seule) */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">URL de ta boutique</label>
          <div className="flex items-center bg-elevated border border-border
                          rounded-xl px-4 py-3 gap-2">
            <Globe size={15} className="text-muted flex-shrink-0" />
            <span className="text-muted text-sm">{slug}.shopeasyci.ci</span>
            <span className="ml-auto text-xs text-muted bg-border px-2 py-0.5 rounded-full">
              Non modifiable
            </span>
          </div>
        </div>
      </div>

      {/* ── WhatsApp ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MessageCircle size={18} className="text-primary" />
          WhatsApp
        </h2>

        {/* Numéro WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Numéro WhatsApp</label>
          <div className="relative">
            <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={form.whatsapp}
              onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
              placeholder="+2250701020304"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4 py-3
                         text-white placeholder-muted focus:outline-none focus:border-primary"
            />
          </div>
          <p className="text-muted text-xs">
            Ce numéro apparaîtra sur le bouton WhatsApp de ta boutique
          </p>
        </div>

        {/* Notif WhatsApp commandes */}
        <div className="flex items-center justify-between p-4 bg-elevated
                        rounded-xl border border-border">
          <div>
            <p className="text-white text-sm font-medium">
              Notifications commandes WhatsApp
            </p>
            <p className="text-muted text-xs mt-0.5">
              Reçois un message WhatsApp à chaque nouvelle commande
            </p>
          </div>
          <button
            onClick={() => setForm(prev => ({
              ...prev,
              whatsappOrderNotif: !prev.whatsappOrderNotif,
            }))}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0
                        ${form.whatsappOrderNotif ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                          transition-transform
                          ${form.whatsappOrderNotif ? 'translate-x-6' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </div>

      {/* ── Bouton sauvegarder ── */}
      <button
        onClick={sauvegarder}
        disabled={sauvegarde}
        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white
                   font-semibold rounded-xl transition-colors disabled:opacity-50
                   flex items-center justify-center gap-2"
      >
        {sauvegarde && <Loader2 size={18} className="animate-spin" />}
        {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
      </button>
    </div>
  );
}