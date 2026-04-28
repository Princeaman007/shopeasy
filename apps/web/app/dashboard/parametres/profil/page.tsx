'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Phone, Lock, Eye, EyeOff, CheckCircle, Loader2, Save } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
};

export default function PageProfil() {
  const { user } = useAuth();

  // ── Profil ──
  const [nom,         setNom]         = useState('');
  const [telephone,   setTelephone]   = useState('');
  const [profilLoad,  setProfilLoad]  = useState(false);
  const [profilSucces, setProfilSucces] = useState('');
  const [profilErreur, setProfilErreur] = useState('');

  // ── Mot de passe ──
  const [ancienMdp,    setAncienMdp]    = useState('');
  const [nouveauMdp,   setNouveauMdp]   = useState('');
  const [confirmerMdp, setConfirmerMdp] = useState('');
  const [showAncien,   setShowAncien]   = useState(false);
  const [showNouveau,  setShowNouveau]  = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [mdpLoad,      setMdpLoad]      = useState(false);
  const [mdpSucces,    setMdpSucces]    = useState('');
  const [mdpErreur,    setMdpErreur]    = useState('');

  useEffect(() => {
    if (user) {
      setNom(user.name ?? '');
      setTelephone((user as any).phone ?? '');
    }
  }, [user]);

  // ── Sauvegarder profil ──
  const sauvegarderProfil = async () => {
    setProfilLoad(true);
    setProfilSucces('');
    setProfilErreur('');
    try {
      const res  = await authFetch(`${API}/auth/update-profile`, {
        method: 'PATCH',
        body:   JSON.stringify({ name: nom, phone: telephone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfilSucces('Profil mis à jour avec succès');
      setTimeout(() => setProfilSucces(''), 3000);
    } catch (err: any) {
      setProfilErreur(err.message);
    } finally {
      setProfilLoad(false);
    }
  };

  // ── Changer mot de passe ──
  const changerMotDePasse = async () => {
    setMdpErreur('');
    setMdpSucces('');

    if (!ancienMdp || !nouveauMdp || !confirmerMdp) {
      setMdpErreur('Tous les champs sont obligatoires');
      return;
    }
    if (nouveauMdp.length < 6) {
      setMdpErreur('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (nouveauMdp !== confirmerMdp) {
      setMdpErreur('Les mots de passe ne correspondent pas');
      return;
    }

    setMdpLoad(true);
    try {
      const res  = await authFetch(`${API}/auth/change-password`, {
        method: 'PATCH',
        body:   JSON.stringify({
          ancienMotDePasse:  ancienMdp,
          nouveauMotDePasse: nouveauMdp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMdpSucces('Mot de passe mis à jour avec succès');
      setAncienMdp('');
      setNouveauMdp('');
      setConfirmerMdp('');
      setTimeout(() => setMdpSucces(''), 3000);
    } catch (err: any) {
      setMdpErreur(err.message);
    } finally {
      setMdpLoad(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">

      {/* En-tête */}
      <div>
        <h1 className="text-white text-2xl font-bold">Mon profil</h1>
        <p className="text-muted text-sm mt-1">
          Gérez vos informations personnelles et votre mot de passe
        </p>
      </div>

      {/* ── Informations personnelles ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <User size={18} className="text-primary" />
          Informations personnelles
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30
                          flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-2xl">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-muted text-sm">{user?.email}</p>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20
                             px-2 py-0.5 rounded-full mt-1 inline-block">
              Marchand
            </span>
          </div>
        </div>

        {/* Nom */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Nom complet</label>
          <div className="relative">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Votre nom"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4
                         py-3 text-white placeholder-muted focus:outline-none
                         focus:border-primary transition-colors text-sm"
            />
          </div>
        </div>

        {/* Téléphone */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Téléphone</label>
          <div className="relative">
            <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4
                         py-3 text-white placeholder-muted focus:outline-none
                         focus:border-primary transition-colors text-sm"
            />
          </div>
        </div>

        {/* Email (lecture seule) */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Email (non modifiable)</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full bg-elevated/50 border border-border rounded-xl px-4
                       py-3 text-muted text-sm cursor-not-allowed"
          />
        </div>

        {profilSucces && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30
                          text-primary px-4 py-3 rounded-xl text-sm">
            <CheckCircle size={15} />
            {profilSucces}
          </div>
        )}
        {profilErreur && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20
                        px-4 py-3 rounded-xl">
            {profilErreur}
          </p>
        )}

        <button
          onClick={sauvegarderProfil}
          disabled={profilLoad}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover
                     text-black font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {profilLoad
            ? <Loader2 size={16} className="animate-spin" />
            : <Save size={16} />
          }
          Sauvegarder
        </button>
      </div>

      {/* ── Changer mot de passe ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Lock size={18} className="text-primary" />
          Changer le mot de passe
        </h2>

        {/* Ancien mot de passe */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Ancien mot de passe</label>
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showAncien ? 'text' : 'password'}
              value={ancienMdp}
              onChange={e => setAncienMdp(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-12
                         py-3 text-white placeholder-muted focus:outline-none
                         focus:border-primary transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowAncien(!showAncien)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted
                         hover:text-white transition-colors"
            >
              {showAncien ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Nouveau mot de passe</label>
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showNouveau ? 'text' : 'password'}
              value={nouveauMdp}
              onChange={e => setNouveauMdp(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-12
                         py-3 text-white placeholder-muted focus:outline-none
                         focus:border-primary transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNouveau(!showNouveau)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted
                         hover:text-white transition-colors"
            >
              {showNouveau ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirmer mot de passe */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Confirmer le nouveau mot de passe</label>
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmerMdp}
              onChange={e => setConfirmerMdp(e.target.value)}
              placeholder="Répétez le mot de passe"
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-12
                         py-3 text-white placeholder-muted focus:outline-none
                         focus:border-primary transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted
                         hover:text-white transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {mdpSucces && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30
                          text-primary px-4 py-3 rounded-xl text-sm">
            <CheckCircle size={15} />
            {mdpSucces}
          </div>
        )}
        {mdpErreur && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20
                        px-4 py-3 rounded-xl">
            {mdpErreur}
          </p>
        )}

        <button
          onClick={changerMotDePasse}
          disabled={mdpLoad}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover
                     text-black font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {mdpLoad
            ? <Loader2 size={16} className="animate-spin" />
            : <Lock size={16} />
          }
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
}