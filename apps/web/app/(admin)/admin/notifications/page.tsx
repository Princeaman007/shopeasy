'use client';

import { useState, useEffect } from 'react';
import {
  Bell, Send, Users, Store, CheckCircle,
  Loader2, RefreshCw, Trash2, X, Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ---------------------------------------------------------------------------
interface Notification {
  _id:       string;
  titre:     string;
  message:   string;
  cible:     'tous' | 'marchands' | 'premium' | 'expires';
  envoye:    number;
  createdAt: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
export default function PageNotificationsAdmin() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chargement,    setChargement]    = useState(true);
  const [modalOuvert,   setModalOuvert]   = useState(false);
  const [envoi,         setEnvoi]         = useState(false);
  const [succes,        setSucces]        = useState('');
  const [erreur,        setErreur]        = useState('');

  const [form, setForm] = useState({
    titre:   '',
    message: '',
    cible:   'tous' as 'tous' | 'marchands' | 'premium' | 'expires',
  });

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  // -- Envoyer notification --
  const envoyer = async () => {
    if (!form.titre.trim() || !form.message.trim()) {
      setErreur('Titre et message obligatoires');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/admin/notifications`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSucces(`Notification envoyée à ${data.data.envoye} boutique(s) !`);
      setModalOuvert(false);
      setForm({ titre: '', message: '', cible: 'tous' });
      charger();
      setTimeout(() => setSucces(''), 4000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  // -- Supprimer --
  const supprimer = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/admin/notifications/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    charger();
  };

  const CIBLES = {
    tous:      { label: 'Tous les marchands',   icone: <Users  size={14} />, couleur: '#06C167' },
    marchands: { label: 'Marchands actifs',     icone: <Store  size={14} />, couleur: '#3b82f6' },
    premium:   { label: 'Marchands Premium',    icone: <Bell   size={14} />, couleur: '#f59e0b' },
    expires:   { label: 'Abonnements expirés',  icone: <Bell   size={14} />, couleur: '#ef4444' },
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Notifications</h1>
          <p className="text-muted text-sm mt-1">
            Envoie des messages à tes marchands
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={charger}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border
                       border-border text-muted hover:text-white text-sm
                       transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-primary hover:bg-primary-hover text-white font-semibold
                       text-sm transition-colors"
          >
            <Plus size={16} />
            Nouvelle notification
          </button>
        </div>
      </div>

      {/* Succès */}
      {succes && (
        <div className="bg-primary/10 border border-primary/30 text-primary
                        px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle size={15} />
          {succes}
        </div>
      )}

      {/* ── Cibles rapides ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(CIBLES) as [string, any][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => {
              setForm(prev => ({ ...prev, cible: key as any }));
              setModalOuvert(true);
            }}
            className="flex items-center gap-3 p-4 bg-surface border border-border
                       rounded-2xl hover:border-primary/30 transition-colors text-left"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center
                         flex-shrink-0"
              style={{ backgroundColor: `${val.couleur}20`, color: val.couleur }}
            >
              {val.icone}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{val.label}</p>
              <p className="text-muted text-xs">Envoyer →</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Historique ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">
          Historique des notifications
        </h2>

        {chargement ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>Aucune notification envoyée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const cible = CIBLES[n.cible as keyof typeof CIBLES];
              return (
                <div
                  key={n._id}
                  className="flex gap-4 p-4 bg-elevated border border-border
                             rounded-xl"
                >
                  {/* Icône cible */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                               flex-shrink-0"
                    style={{
                      backgroundColor: `${cible?.couleur ?? '#888'}20`,
                      color:           cible?.couleur ?? '#888',
                    }}
                  >
                    <Bell size={18} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">
                        {n.titre}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${cible?.couleur ?? '#888'}15`,
                          borderColor:     `${cible?.couleur ?? '#888'}30`,
                          color:           cible?.couleur ?? '#888',
                        }}
                      >
                        {cible?.label ?? n.cible}
                      </span>
                    </div>
                    <p className="text-muted text-sm mt-1 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-muted text-xs">
                        {formatDate(n.createdAt)}
                      </p>
                      <span className="text-xs text-primary">
                        {n.envoye} destinataire{n.envoye > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => supprimer(n._id)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-400
                               hover:bg-red-400/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal nouvelle notification ── */}
      {modalOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
                        bg-black/70 px-4">
          <div className="bg-surface border border-border rounded-2xl w-full
                          max-w-lg p-6 space-y-5">

            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">
                Nouvelle notification
              </h2>
              <button
                onClick={() => { setModalOuvert(false); setErreur(''); }}
                className="p-1.5 rounded-lg text-muted hover:text-white
                           hover:bg-elevated transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cible */}
            <div className="space-y-1.5">
              <label className="text-muted text-sm">Destinataires *</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(CIBLES) as [string, any][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setForm(prev => ({
                      ...prev, cible: key as any,
                    }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border
                                text-left text-sm transition-all
                                ${form.cible === key
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-elevated text-muted hover:text-white'}`}
                  >
                    {val.icone}
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Titre */}
            <div className="space-y-1.5">
              <label className="text-muted text-sm">Titre *</label>
              <input
                value={form.titre}
                onChange={e => setForm(prev => ({
                  ...prev, titre: e.target.value,
                }))}
                placeholder="Ex : Nouveau thème disponible !"
                maxLength={100}
                className="w-full bg-elevated border border-border rounded-xl
                           px-4 py-3 text-white placeholder-muted focus:outline-none
                           focus:border-primary text-sm"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-muted text-sm">Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(prev => ({
                  ...prev, message: e.target.value,
                }))}
                placeholder="Contenu de la notification..."
                rows={4}
                maxLength={500}
                className="w-full bg-elevated border border-border rounded-xl
                           px-4 py-3 text-white placeholder-muted focus:outline-none
                           focus:border-primary text-sm resize-none"
              />
              <p className="text-muted text-xs text-right">
                {form.message.length}/500
              </p>
            </div>

            {erreur && (
              <p className="text-red-400 text-sm">{erreur}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setModalOuvert(false); setErreur(''); }}
                className="flex-1 py-3 rounded-xl border border-border text-muted
                           hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={envoyer}
                disabled={envoi}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover
                           text-white font-semibold transition-colors disabled:opacity-50
                           flex items-center justify-center gap-2"
              >
                {envoi
                  ? <><Loader2 size={16} className="animate-spin" /> Envoi...</>
                  : <><Send size={16} /> Envoyer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}