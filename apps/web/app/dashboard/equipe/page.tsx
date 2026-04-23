'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, Trash2, Loader2, Crown, Mail } from 'lucide-react';
import Link from 'next/link';
interface MembreEquipe {
  _id:   string;
  name:  string;
  email: string;
  role:  string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EquipePage() {
  const { token, shop } = useAuth();
  const isPremium = shop?.planType === 'premium';

  const [membres,     setMembres]     = useState<MembreEquipe[]>([]);
  const [chargement,  setChargement]  = useState(true);
  const [email,       setEmail]       = useState('');
  const [ajout,       setAjout]       = useState(false);
  const [suppression, setSuppression] = useState<string | null>(null);
  const [succes,      setSucces]      = useState('');
  const [erreur,      setErreur]      = useState('');

  //  Chargement membres 
  useEffect(() => {
    const fetchMembres = async () => {
      if (!token) return;
      try {
        const res  = await fetch(`${API}/shops/me/equipe`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMembres(data.membres || []);
      } catch {
        setErreur('Impossible de charger l\'équipe');
      } finally {
        setChargement(false);
      }
    };
    fetchMembres();
  }, [token]);

  //  Ajouter un membre 
  const ajouterMembre = async () => {
    if (!email.trim()) { setErreur('Email obligatoire'); return; }
    setErreur('');
    setAjout(true);
    try {
      const res  = await fetch(`${API}/shops/me/equipe`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');
      setMembres(data.membres || []);
      setEmail('');
      setSucces('Membre ajouté avec succès !');
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setAjout(false);
    }
  };

  //  Supprimer un membre 
  const supprimerMembre = async (userId: string) => {
    setSuppression(userId);
    try {
      const res  = await fetch(`${API}/shops/me/equipe/${userId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');
      setMembres(data.membres || []);
      setSucces('Membre retiré');
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setSuppression(null);
    }
  };

  //  Plan Basic 
  if (!isPremium) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Crown size={28} className="text-primary" />
        </div>
        <h2 className="text-white font-bold text-xl">Fonctionnalité Premium</h2>
        <p className="text-muted text-sm max-w-sm mx-auto">
          La gestion d'équipe est réservée aux boutiques Premium. Passez au plan Premium pour inviter des collaborateurs.
        </p>
        <Link
          href="/dashboard/parametres/abonnement"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <Crown size={16} />
          Passer en Premium
        </Link>
      </div>
    </div>
  );
}

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-white">Équipe</h1>
        <p className="text-muted text-sm mt-1">
          Invitez des collaborateurs pour gérer votre boutique
        </p>
      </div>

      {/* Notifications */}
      {succes && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl text-sm font-medium">
           {succes}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      {/*  Ajouter un membre  */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <UserPlus size={18} className="text-primary" />
          Inviter un collaborateur
        </h2>
        <p className="text-muted text-sm">
          Le collaborateur doit déjà avoir un compte ShopEasy CI.
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErreur(''); }}
              placeholder="email@collaborateur.com"
              className="w-full bg-elevated border border-border rounded-xl pl-9 pr-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
              onKeyDown={(e) => e.key === 'Enter' && ajouterMembre()}
            />
          </div>
          <button
            onClick={ajouterMembre}
            disabled={ajout || !email.trim()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
          >
            {ajout ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Inviter
          </button>
        </div>
      </div>

      {/*  Liste membres  */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <h2 className="text-white font-semibold">
            Membres de l'équipe
            <span className="ml-2 text-muted text-sm font-normal">({membres.length})</span>
          </h2>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-primary animate-spin" />
          </div>
        ) : membres.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users size={36} className="text-muted mx-auto" />
            <p className="text-muted text-sm">Aucun collaborateur pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {membres.map((membre) => (
              <div key={membre._id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {membre.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{membre.name}</p>
                    <p className="text-muted text-xs">{membre.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Collaborateur
                  </span>
                  <button
                    onClick={() => supprimerMembre(membre._id)}
                    disabled={suppression === membre._id}
                    className="w-8 h-8 rounded-xl bg-elevated hover:bg-red-500/10 border border-border hover:border-red-500/30 flex items-center justify-center text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {suppression === membre._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 text-xs leading-relaxed">
           Les collaborateurs peuvent gérer les produits et commandes de votre boutique. Ils n'ont pas accès aux paramètres de paiement ni à la gestion de l'équipe.
        </p>
      </div>
    </div>
  );
}