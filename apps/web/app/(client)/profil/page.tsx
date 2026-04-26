'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ArrowLeft, Pencil, Check, X, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilPage() {
  const { user, login, token } = useAuth();

  // ── État formulaire infos ───────────────────────────────────
  const [editInfos, setEditInfos]   = useState(false);
  const [editMdp, setEditMdp]       = useState(false);
  const [erreur, setErreur]         = useState('');
  const [succes, setSucces]         = useState('');
  const [loading, setLoading]       = useState(false);

  const [formInfos, setFormInfos] = useState({
    name:  user?.name  || '',
    phone: '',
  });

  const [formMdp, setFormMdp] = useState({
    actuel:      '',
    nouveau:     '',
    confirmation:'',
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ── Sauvegarder infos ───────────────────────────────────────
  const sauvegarderInfos = async () => {
    if (!formInfos.name.trim()) {
      setErreur('Le nom est obligatoire');
      return;
    }
    setErreur('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/profil`,
        {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify(formInfos),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message || 'Erreur'); return; }

      // Met à jour le contexte auth
      login(token!, { ...user!, name: formInfos.name });
      setSucces('Profil mis à jour ✅');
      setEditInfos(false);
      setTimeout(() => setSucces(''), 3000);
    } catch {
      setErreur('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ── Changer mot de passe ────────────────────────────────────
  const changerMotDePasse = async () => {
    if (!formMdp.actuel || !formMdp.nouveau) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }
    if (formMdp.nouveau.length < 6) {
      setErreur('Minimum 6 caractères');
      return;
    }
    if (formMdp.nouveau !== formMdp.confirmation) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    setErreur('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/changer-mot-de-passe`,
        {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            currentPassword: formMdp.actuel,
            newPassword:     formMdp.nouveau,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message || 'Erreur'); return; }

      setSucces('Mot de passe modifié ✅');
      setEditMdp(false);
      setFormMdp({ actuel: '', nouveau: '', confirmation: '' });
      setTimeout(() => setSucces(''), 3000);
    } catch {
      setErreur('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mon profil</h1>
              <p className="text-muted text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {/* Succès */}
        {succes && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-primary text-sm">{succes}</div>
        )}

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{erreur}</div>
        )}

        {/* ── Infos personnelles ── */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Informations personnelles</h2>
            {!editInfos && (
              <button
                onClick={() => { setEditInfos(true); setFormInfos({ name: user?.name || '', phone: '' }); }}
                className="inline-flex items-center gap-1.5 text-muted hover:text-white text-sm transition-colors"
              >
                <Pencil size={14} /> Modifier
              </button>
            )}
          </div>

          {editInfos ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-muted text-xs uppercase tracking-wide">Nom complet</label>
                <input
                  value={formInfos.name}
                  onChange={(e) => setFormInfos({ ...formInfos, name: e.target.value })}
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted text-xs uppercase tracking-wide">Téléphone</label>
                <input
                  value={formInfos.phone}
                  onChange={(e) => setFormInfos({ ...formInfos, phone: e.target.value })}
                  placeholder="0700000000"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={sauvegarderInfos}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Sauvegarder
                </button>
                <button
                  onClick={() => { setEditInfos(false); setErreur(''); }}
                  className="inline-flex items-center gap-2 bg-elevated hover:bg-border border border-border text-muted hover:text-white px-4 py-2 rounded-xl transition-colors text-sm"
                >
                  <X size={14} /> Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted text-sm">Nom</span>
                <span className="text-white text-sm font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted text-sm">Email</span>
                <span className="text-white text-sm font-medium">{user?.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Mot de passe ── */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-muted" />
              <h2 className="text-white font-semibold">Mot de passe</h2>
            </div>
            {!editMdp && (
              <button
                onClick={() => setEditMdp(true)}
                className="inline-flex items-center gap-1.5 text-muted hover:text-white text-sm transition-colors"
              >
                <Pencil size={14} /> Modifier
              </button>
            )}
          </div>

          {editMdp ? (
            <div className="space-y-4">
              {['actuel', 'nouveau', 'confirmation'].map((champ) => (
                <div key={champ} className="space-y-1.5">
                  <label className="text-muted text-xs uppercase tracking-wide">
                    {champ === 'actuel' ? 'Mot de passe actuel' : champ === 'nouveau' ? 'Nouveau mot de passe' : 'Confirmation'}
                  </label>
                  <input
                    type="password"
                    value={formMdp[champ as keyof typeof formMdp]}
                    onChange={(e) => setFormMdp({ ...formMdp, [champ]: e.target.value })}
                    className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={changerMotDePasse}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Sauvegarder
                </button>
                <button
                  onClick={() => { setEditMdp(false); setErreur(''); setFormMdp({ actuel: '', nouveau: '', confirmation: '' }); }}
                  className="inline-flex items-center gap-2 bg-elevated hover:bg-border border border-border text-muted hover:text-white px-4 py-2 rounded-xl transition-colors text-sm"
                >
                  <X size={14} /> Annuler
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm">••••••••</p>
          )}
        </div>

        {/* ── Liens rapides ── */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Accès rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mes commandes', href: '/mes-commandes' },
              { label: 'Mes favoris',   href: '/mes-favoris'   },
              { label: 'Mes adresses',  href: '/mes-adresses'  },
            ].map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="bg-elevated hover:bg-border border border-border rounded-xl px-4 py-3 text-white text-sm font-medium transition-colors text-center"
              >
                {lien.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}