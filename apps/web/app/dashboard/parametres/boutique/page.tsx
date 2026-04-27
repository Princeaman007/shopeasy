'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, Upload, X, Store, Phone, MessageCircle, Globe, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface FormBoutique {
  name:               string;
  whatsapp:           string;
  whatsappOrderNotif: boolean;
  logo?:              string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PageParamsBoutique() {
  const [form,         setForm]         = useState<FormBoutique>({
    name:               '',
    whatsapp:           '',
    whatsappOrderNotif: true,
  });
  const [slug,         setSlug]         = useState('');
  const [logoPreview,  setLogoPreview]  = useState('');
  const [logoFile,     setLogoFile]     = useState<File | null>(null);
  const [heroPreview,  setHeroPreview]  = useState('');
  const [heroFile,     setHeroFile]     = useState<File | null>(null);
  const [chargement,   setChargement]   = useState(true);
  const [sauvegarde,   setSauvegarde]   = useState(false);
  const [succes,       setSucces]       = useState('');
  const [erreur,       setErreur]       = useState('');
  const logoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

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
            name:               b.name              ?? '',
            whatsapp:           b.whatsapp           ?? '',
            whatsappOrderNotif: b.whatsappOrderNotif ?? true,
            logo:               b.logo              ?? '',
          });
          setSlug(b.slug ?? '');
          if (b.logo)       setLogoPreview(b.logo);
          if (b.heroImage)  setHeroPreview(b.heroImage);
        }
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setErreur('Logo max 2 Mo'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErreur('');
  };

  const onHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErreur('Image hero max 10 Mo'); return; }
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
    setErreur('');
  };

  const sauvegarder = async () => {
    if (!form.name.trim()) { setErreur('Le nom est obligatoire'); return; }
    if (form.whatsapp && !/^\+?[0-9]{8,15}$/.test(form.whatsapp.replace(/\s/g, ''))) {
      setErreur('Numero WhatsApp invalide (ex: +2250701020304)'); return;
    }

    setSauvegarde(true);
    setErreur('');
    setSucces('');

    try {
      const token = localStorage.getItem('token');

      // 1. Upload logo si nouveau fichier
      let logoUrl = form.logo ?? '';
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const uploadRes  = await fetch(`${API}/shops/me/logo`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) logoUrl = uploadData.url;
      }

      // 2. Upload hero si nouveau fichier
      if (heroFile) {
        const formData = new FormData();
        formData.append('file', heroFile);
        const uploadRes  = await fetch(`${API}/shops/me/hero`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) setHeroPreview(uploadData.url);
      }

      // 3. Sauvegarde parametres
      const res  = await fetch(`${API}/shops/me`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          name:               form.name.trim(),
          whatsapp:           form.whatsapp.trim(),
          whatsappOrderNotif: form.whatsappOrderNotif,
          logo:               logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');

      setSucces('Parametres sauvegardes !');
      setLogoFile(null);
      setHeroFile(null);
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setSauvegarde(false);
    }
  };

  if (chargement) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-white text-2xl font-bold">Parametres boutique</h1>
        <p className="text-muted text-sm mt-1">Personnalise les informations principales de ta boutique</p>
      </div>

      {succes && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check size={16} /> {succes}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      {/* ── Image Hero ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <ImageIcon size={18} className="text-primary" />
          Image de couverture (Hero)
        </h2>
        <p className="text-muted text-xs">
          Cette image s'affiche en banniere en haut de ta boutique. Recommande : 1920x600px, max 10 Mo.
        </p>

        {/* Apercu hero */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-dashed border-border bg-elevated">
          {heroPreview ? (
            <>
              <Image src={heroPreview} alt="Hero" fill className="object-cover" />
              <button
                onClick={() => { setHeroFile(null); setHeroPreview(''); if (heroRef.current) heroRef.current.value = ''; }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center text-white z-10 hover:bg-red-500 transition-colors">
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <ImageIcon size={28} className="text-muted" />
              <p className="text-muted text-xs">Aucune image de couverture</p>
            </div>
          )}
        </div>

        <button onClick={() => heroRef.current?.click()}
          className="flex items-center gap-2 bg-elevated border border-border hover:border-primary/50 text-white px-4 py-2 rounded-xl text-sm transition-colors">
          <Upload size={15} />
          {heroPreview ? 'Changer la couverture' : 'Ajouter une couverture'}
        </button>
        <input ref={heroRef} type="file" accept="image/*" onChange={onHeroChange} className="hidden" />
      </div>

      {/* ── Logo ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Store size={18} className="text-primary" />
          Logo de la boutique
        </h2>

        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-elevated flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {logoPreview ? (
              <>
                <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                <button onClick={() => { setLogoFile(null); setLogoPreview(''); setForm(prev => ({ ...prev, logo: '' })); if (logoRef.current) logoRef.current.value = ''; }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white z-10">
                  <X size={10} />
                </button>
              </>
            ) : (
              <Store size={28} className="text-muted" />
            )}
          </div>
          <div className="space-y-2">
            <button onClick={() => logoRef.current?.click()}
              className="flex items-center gap-2 bg-elevated border border-border hover:border-primary/50 text-white px-4 py-2 rounded-xl text-sm transition-colors">
              <Upload size={15} />
              {logoPreview ? 'Changer le logo' : 'Uploader un logo'}
            </button>
            <p className="text-muted text-xs">PNG, JPG — max 2 Mo — recommande 200x200px</p>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
      </div>

      {/* ── Informations generales ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          Informations generales
        </h2>

        <div className="space-y-1.5">
          <label className="text-muted text-sm">Nom de la boutique <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex : Boutique Aminata" maxLength={60}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary" />
        </div>

        <div className="space-y-1.5">
          <label className="text-muted text-sm">URL de ta boutique</label>
          <div className="flex items-center bg-elevated border border-border rounded-xl px-4 py-3 gap-2">
            <Globe size={15} className="text-muted flex-shrink-0" />
            <span className="text-muted text-sm">{slug}.shopeasyci.store</span>
            <span className="ml-auto text-xs text-muted bg-border px-2 py-0.5 rounded-full">Non modifiable</span>
          </div>
        </div>
      </div>

      {/* ── WhatsApp ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MessageCircle size={18} className="text-primary" />
          WhatsApp
        </h2>

        <div className="space-y-1.5">
          <label className="text-muted text-sm">Numero WhatsApp</label>
          <div className="relative">
            <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={form.whatsapp} onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
              placeholder="+2250701020304"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary" />
          </div>
          <p className="text-muted text-xs">Ce numero apparaitra sur le bouton WhatsApp de ta boutique</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
          <div>
            <p className="text-white text-sm font-medium">Notifications commandes WhatsApp</p>
            <p className="text-muted text-xs mt-0.5">Recois un message WhatsApp a chaque nouvelle commande</p>
          </div>
          <button onClick={() => setForm(prev => ({ ...prev, whatsappOrderNotif: !prev.whatsappOrderNotif }))}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.whatsappOrderNotif ? 'bg-primary' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.whatsappOrderNotif ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* ── Bouton sauvegarder ── */}
      <button onClick={sauvegarder} disabled={sauvegarde}
        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {sauvegarde && <Loader2 size={18} className="animate-spin" />}
        {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
      </button>
    </div>
  );
}