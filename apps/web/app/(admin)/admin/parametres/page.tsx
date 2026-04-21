'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Save, Loader2, Check, Shield,
  CreditCard, Globe, Bell, UserPlus, Eye, EyeOff,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

// ---------------------------------------------------------------------------
export default function PageParametresAdmin() {
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');

  // -- Onglet actif --
  type OngletType = 'plateforme' | 'tarifs' | 'admin' | 'maintenance';
  const [onglet, setOnglet] = useState<OngletType>('plateforme');
  // -- Paramètres plateforme --
  const [config, setConfig] = useState({
    nomPlateforme: 'ShopEasy CI',
    emailContact: 'contact@shopeasyci.ci',
    whatsappSupport: '+2250700000000',
    urlPlateforme: 'https://shopeasyci.ci',
    maintenanceMode: false,
    inscriptionsOuvertes: true,
    maxProduitsBasic: 10,
    maxPhotosBasic: 5,
  });

  // -- Tarifs --
  const [tarifs, setTarifs] = useState({
    prixBasic: 15000,
    prixPremium: 30000,
    dureeEssai: 7,
  });

  // -- Nouveau admin --
  const [newAdmin, setNewAdmin] = useState({
    name: '', email: '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSucces, setAdminSucces] = useState('');
  const [adminErreur, setAdminErreur] = useState('');

  // -- Chargement --
  useEffect(() => {
    const charger = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/admin/config`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          if (data.data.config) setConfig(prev => ({ ...prev, ...data.data.config }));
          if (data.data.tarifs) setTarifs(prev => ({ ...prev, ...data.data.tarifs }));
        }
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  // -- Sauvegarder config --
  const sauvegarder = async () => {
    setSauvegarde(true);
    setErreur('');
    setSucces('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config, tarifs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSucces('Paramètres sauvegardés avec succès !');
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setSauvegarde(false);
    }
  };

  // -- Créer admin --
  const creerAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setAdminErreur('Tous les champs sont obligatoires');
      return;
    }
    setAdminLoading(true);
    setAdminErreur('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAdminSucces(`Compte admin créé pour ${newAdmin.email}`);
      setNewAdmin({ name: '', email: '', password: '' });
      setTimeout(() => setAdminSucces(''), 4000);
    } catch (err: any) {
      setAdminErreur(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const ONGLETS = [
    { id: 'plateforme', label: 'Plateforme', icone: <Globe size={16} /> },
    { id: 'tarifs', label: 'Tarifs', icone: <CreditCard size={16} /> },
    { id: 'admin', label: 'Admins', icone: <Shield size={16} /> },
    { id: 'maintenance', label: 'Maintenance', icone: <Settings size={16} /> },
  ];

  // ---------------------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* En-tête */}
      <div>
        <h1 className="text-white text-2xl font-bold">Paramètres</h1>
        <p className="text-muted text-sm mt-1">
          Configuration de la plateforme ShopEasy CI
        </p>
      </div>

      {/* Succès / Erreur globaux */}
      {succes && (
        <div className="bg-primary/10 border border-primary/30 text-primary
                        px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={15} />
          {succes}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400
                        px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-elevated border border-border rounded-xl p-1">
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm
                        font-medium transition-colors flex-1 justify-center
                        ${onglet === o.id
                ? 'bg-surface text-white shadow-sm'
                : 'text-muted hover:text-white'}`}
          >
            {o.icone}
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        ))}
      </div>

      {/* ── Onglet Plateforme ── */}
      {onglet === 'plateforme' && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            Informations plateforme
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nom de la plateforme', key: 'nomPlateforme', placeholder: 'ShopEasy CI' },
              { label: 'Email contact', key: 'emailContact', placeholder: 'contact@shopeasyci.ci' },
              { label: 'WhatsApp support', key: 'whatsappSupport', placeholder: '+2250700000000' },
              { label: 'URL plateforme', key: 'urlPlateforme', placeholder: 'https://shopeasyci.ci' },
            ].map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-muted text-sm">{field.label}</label>
                <input
                  value={(config as any)[field.key]}
                  onChange={e => setConfig(prev => ({
                    ...prev, [field.key]: e.target.value,
                  }))}
                  placeholder={field.placeholder}
                  className="w-full bg-elevated border border-border rounded-xl
                             px-4 py-3 text-white placeholder-muted focus:outline-none
                             focus:border-primary text-sm"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Max produits (Basic)', key: 'maxProduitsBasic', type: 'number' },
              { label: 'Max photos (Basic)', key: 'maxPhotosBasic', type: 'number' },
            ].map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-muted text-sm">{field.label}</label>
                <input
                  type="number"
                  value={(config as any)[field.key]}
                  onChange={e => setConfig(prev => ({
                    ...prev, [field.key]: Number(e.target.value),
                  }))}
                  className="w-full bg-elevated border border-border rounded-xl
                             px-4 py-3 text-white focus:outline-none
                             focus:border-primary text-sm"
                />
              </div>
            ))}
          </div>

          <button
            onClick={sauvegarder}
            disabled={sauvegarde}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary
                       hover:bg-primary-hover text-white font-semibold text-sm
                       transition-colors disabled:opacity-50"
          >
            {sauvegarde
              ? <Loader2 size={16} className="animate-spin" />
              : <Save size={16} />
            }
            Sauvegarder
          </button>
        </div>
      )}

      {/* ── Onglet Tarifs ── */}
      {onglet === 'tarifs' && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            Tarifs des abonnements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Prix Basic (FCFA/mois)', key: 'prixBasic' },
              { label: 'Prix Premium (FCFA/mois)', key: 'prixPremium' },
              { label: "Durée essai (jours)", key: 'dureeEssai' },
            ].map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-muted text-sm">{field.label}</label>
                <input
                  type="number"
                  value={(tarifs as any)[field.key]}
                  onChange={e => setTarifs(prev => ({
                    ...prev, [field.key]: Number(e.target.value),
                  }))}
                  className="w-full bg-elevated border border-border rounded-xl
                             px-4 py-3 text-white focus:outline-none
                             focus:border-primary text-sm"
                />
              </div>
            ))}
          </div>

          {/* Aperçu */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                plan: 'Basic',
                prix: tarifs.prixBasic,
                couleur: '#06C167',
                feats: ['10 produits max', '5 photos/produit', '2 thèmes'],
              },
              {
                plan: 'Premium',
                prix: tarifs.prixPremium,
                couleur: '#f59e0b',
                feats: ['Produits illimités', 'Photos illimitées', '5 thèmes'],
              },
            ].map(p => (
              <div
                key={p.plan}
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: `${p.couleur}08`,
                  borderColor: `${p.couleur}30`,
                }}
              >
                <p className="font-bold" style={{ color: p.couleur }}>
                  {p.plan}
                </p>
                <p className="text-white text-xl font-bold">
                  {new Intl.NumberFormat('fr-FR').format(p.prix)} FCFA
                  <span className="text-muted text-xs font-normal">/mois</span>
                </p>
                <ul className="space-y-1">
                  {p.feats.map(f => (
                    <li key={f} className="text-xs text-muted flex items-center gap-1">
                      <Check size={11} style={{ color: p.couleur }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            onClick={sauvegarder}
            disabled={sauvegarde}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary
                       hover:bg-primary-hover text-white font-semibold text-sm
                       transition-colors disabled:opacity-50"
          >
            {sauvegarde
              ? <Loader2 size={16} className="animate-spin" />
              : <Save size={16} />
            }
            Sauvegarder
          </button>
        </div>
      )}

      {/* ── Onglet Admins ── */}
      {onglet === 'admin' && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            Créer un compte administrateur
          </h2>

          {adminSucces && (
            <div className="bg-primary/10 border border-primary/30 text-primary
                            px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <Check size={15} />
              {adminSucces}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-muted text-sm">Nom complet *</label>
              <input
                value={newAdmin.name}
                onChange={e => setNewAdmin(prev => ({
                  ...prev, name: e.target.value,
                }))}
                placeholder="Super Admin"
                className="w-full bg-elevated border border-border rounded-xl
                           px-4 py-3 text-white placeholder-muted focus:outline-none
                           focus:border-primary text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted text-sm">Email *</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin(prev => ({
                  ...prev, email: e.target.value,
                }))}
                placeholder="admin@shopeasyci.ci"
                className="w-full bg-elevated border border-border rounded-xl
                           px-4 py-3 text-white placeholder-muted focus:outline-none
                           focus:border-primary text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted text-sm">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newAdmin.password}
                  onChange={e => setNewAdmin(prev => ({
                    ...prev, password: e.target.value,
                  }))}
                  placeholder="Mot de passe sécurisé"
                  className="w-full bg-elevated border border-border rounded-xl
                             px-4 py-3 pr-12 text-white placeholder-muted
                             focus:outline-none focus:border-primary text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {adminErreur && (
              <p className="text-red-400 text-sm">{adminErreur}</p>
            )}

            <button
              onClick={creerAdmin}
              disabled={adminLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary
                         hover:bg-primary-hover text-white font-semibold text-sm
                         transition-colors disabled:opacity-50"
            >
              {adminLoading
                ? <Loader2 size={16} className="animate-spin" />
                : <UserPlus size={16} />
              }
              Créer le compte admin
            </button>
          </div>
        </div>
      )}

      {/* ── Onglet Maintenance ── */}
      {onglet === 'maintenance' && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Mode maintenance
          </h2>

          <div className="space-y-4">
            {/* Toggle inscriptions */}
            <div className="flex items-center justify-between p-4 bg-elevated
                            rounded-xl border border-border">
              <div>
                <p className="text-white text-sm font-medium">
                  Inscriptions ouvertes
                </p>
                <p className="text-muted text-xs mt-0.5">
                  Autoriser les nouvelles inscriptions marchands
                </p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  inscriptionsOuvertes: !prev.inscriptionsOuvertes,
                }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                            flex-shrink-0
                            ${config.inscriptionsOuvertes
                    ? 'bg-primary' : 'bg-border'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full
                              shadow transition-transform
                              ${config.inscriptionsOuvertes
                      ? 'translate-x-6' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            {/* Toggle maintenance */}
            <div className={`flex items-center justify-between p-4 rounded-xl border
                            ${config.maintenanceMode
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-elevated border-border'}`}>
              <div>
                <p className="text-white text-sm font-medium">
                  Mode maintenance
                </p>
                <p className="text-muted text-xs mt-0.5">
                  {config.maintenanceMode
                    ? '⚠️ La plateforme est actuellement en maintenance'
                    : 'La plateforme est accessible normalement'
                  }
                </p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  maintenanceMode: !prev.maintenanceMode,
                }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                            flex-shrink-0
                            ${config.maintenanceMode
                    ? 'bg-red-500' : 'bg-border'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full
                              shadow transition-transform
                              ${config.maintenanceMode
                      ? 'translate-x-6' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            {config.maintenanceMode && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10
                              border border-red-500/20 rounded-xl">
                <Bell size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">
                  Le mode maintenance est activé. Les visiteurs verront une page
                  de maintenance. Seuls les admins peuvent accéder au dashboard.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={sauvegarder}
            disabled={sauvegarde}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary
                       hover:bg-primary-hover text-white font-semibold text-sm
                       transition-colors disabled:opacity-50"
          >
            {sauvegarde
              ? <Loader2 size={16} className="animate-spin" />
              : <Save size={16} />
            }
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
}