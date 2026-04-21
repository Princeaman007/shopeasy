'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Plus, Trash2, Copy, Check, Lock,
  Tag, Percent, DollarSign, Calendar, Users,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CodePromo {
  _id:        string;
  code:       string;
  type:       'percent' | 'fixed';
  value:      number;
  minOrder?:  number;
  maxUses?:   number;
  usedCount:  number;
  expiresAt?: string;
  isActive:   boolean;
  createdAt:  string;
}

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ---------------------------------------------------------------------------
// Modal création code promo
// ---------------------------------------------------------------------------
function ModalCodePromo({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave:  () => void;
}) {
  const [form, setForm] = useState({
    code:      '',
    type:      'percent' as 'percent' | 'fixed',
    value:     10,
    minOrder:  '',
    maxUses:   '',
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [erreur,  setErreur]  = useState('');

  // -- Génère un code aléatoire --
  const genererCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code  = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    setForm(prev => ({ ...prev, code }));
  };

  const creer = async () => {
    if (!form.code.trim())   { setErreur('Le code est obligatoire');   return; }
    if (form.value <= 0)     { setErreur('La valeur doit être > 0');   return; }
    if (form.type === 'percent' && form.value > 100) {
      setErreur('Le pourcentage ne peut pas dépasser 100%');
      return;
    }

    setLoading(true);
    setErreur('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/promos`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          code:      form.code.toUpperCase().trim(),
          type:      form.type,
          value:     Number(form.value),
          minOrder:  form.minOrder  ? Number(form.minOrder)  : undefined,
          maxUses:   form.maxUses   ? Number(form.maxUses)   : undefined,
          expiresAt: form.expiresAt ? form.expiresAt         : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');
      onSave();
      onClose();
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-5
                      max-h-[90vh] overflow-y-auto">

        <h2 className="text-white font-semibold text-lg">Nouveau code promo</h2>

        {/* Code */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Code *</label>
          <div className="flex gap-2">
            <input
              value={form.code}
              onChange={e => setForm(prev => ({
                ...prev, code: e.target.value.toUpperCase(),
              }))}
              placeholder="EX : NOEL25"
              maxLength={20}
              className="flex-1 bg-elevated border border-border rounded-xl px-4 py-3
                         text-white placeholder-muted focus:outline-none focus:border-primary
                         font-mono tracking-widest uppercase"
            />
            <button
              onClick={genererCode}
              className="px-4 py-3 bg-elevated border border-border rounded-xl
                         text-muted hover:text-white hover:border-primary/50 text-sm
                         transition-colors whitespace-nowrap"
            >
              Générer
            </button>
          </div>
        </div>

        {/* Type réduction */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Type de réduction *</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { val: 'percent', label: 'Pourcentage (%)', icone: <Percent size={16} /> },
              { val: 'fixed',   label: 'Montant fixe',   icone: <DollarSign size={16} /> },
            ] as const).map(t => (
              <button
                key={t.val}
                onClick={() => setForm(prev => ({ ...prev, type: t.val }))}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all
                            ${form.type === t.val
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-elevated text-muted hover:text-white'}`}
              >
                {t.icone}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Valeur */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">
            Valeur * {form.type === 'percent' ? '(%)' : '(FCFA)'}
          </label>
          <input
            type="number"
            value={form.value}
            onChange={e => setForm(prev => ({ ...prev, value: Number(e.target.value) }))}
            min={1}
            max={form.type === 'percent' ? 100 : undefined}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white focus:outline-none focus:border-primary"
          />
        </div>

        {/* Commande minimum */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Commande minimum (FCFA) — optionnel</label>
          <input
            type="number"
            value={form.minOrder}
            onChange={e => setForm(prev => ({ ...prev, minOrder: e.target.value }))}
            placeholder="Ex : 10000"
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Nombre max d'utilisations */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Nombre max d'utilisations — optionnel</label>
          <input
            type="number"
            value={form.maxUses}
            onChange={e => setForm(prev => ({ ...prev, maxUses: e.target.value }))}
            placeholder="Ex : 50 (laisser vide = illimité)"
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Date expiration */}
        <div className="space-y-1.5">
          <label className="text-muted text-sm">Date d'expiration — optionnel</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={e => setForm(prev => ({ ...prev, expiresAt: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white focus:outline-none focus:border-primary"
          />
        </div>

        {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-muted
                       hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={creer}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover
                       text-white font-semibold transition-colors disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carte code promo
// ---------------------------------------------------------------------------
function CarteCodePromo({
  code,
  onToggle,
  onDelete,
  onCopy,
  copied,
}: {
  code:     CodePromo;
  onToggle: () => void;
  onDelete: () => void;
  onCopy:   () => void;
  copied:   boolean;
}) {
  const expire   = code.expiresAt ? new Date(code.expiresAt) < new Date() : false;
  const epuise   = code.maxUses ? code.usedCount >= code.maxUses : false;
  const inactif  = !code.isActive || expire || epuise;

  return (
    <div className={`bg-surface border rounded-2xl p-5 space-y-4 transition-all
                    ${inactif ? 'border-border opacity-60' : 'border-border hover:border-primary/30'}`}>

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Code */}
          <div className="flex items-center gap-2 bg-elevated border border-border
                          rounded-xl px-3 py-1.5">
            <Tag size={13} className="text-primary" />
            <span className="text-white font-mono font-bold tracking-widest text-sm">
              {code.code}
            </span>
          </div>

          {/* Statut */}
          {expire  && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Expiré</span>}
          {epuise  && <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Épuisé</span>}
          {!inactif && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Actif</span>}
          {!code.isActive && !expire && !epuise &&
            <span className="text-xs text-muted bg-elevated px-2 py-0.5 rounded-full border border-border">
              Désactivé
            </span>
          }
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            title="Copier le code"
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-muted hover:text-white hover:bg-elevated transition-colors"
          >
            {copied ? <Check size={15} className="text-primary" /> : <Copy size={15} />}
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 gap-3">
        {/* Réduction */}
        <div className="bg-elevated rounded-xl p-3">
          <p className="text-muted text-xs">Réduction</p>
          <p className="text-white font-bold mt-0.5">
            {code.type === 'percent'
              ? `${code.value}%`
              : formatFcfa(code.value)
            }
          </p>
        </div>

        {/* Utilisations */}
        <div className="bg-elevated rounded-xl p-3">
          <p className="text-muted text-xs flex items-center gap-1">
            <Users size={11} /> Utilisations
          </p>
          <p className="text-white font-bold mt-0.5">
            {code.usedCount}
            {code.maxUses ? ` / ${code.maxUses}` : ' / ∞'}
          </p>
        </div>

        {/* Commande min */}
        {code.minOrder && (
          <div className="bg-elevated rounded-xl p-3">
            <p className="text-muted text-xs">Commande min.</p>
            <p className="text-white font-bold mt-0.5">{formatFcfa(code.minOrder)}</p>
          </div>
        )}

        {/* Expiration */}
        {code.expiresAt && (
          <div className="bg-elevated rounded-xl p-3">
            <p className="text-muted text-xs flex items-center gap-1">
              <Calendar size={11} /> Expire le
            </p>
            <p className={`font-bold mt-0.5 text-sm ${expire ? 'text-red-400' : 'text-white'}`}>
              {formatDate(code.expiresAt)}
            </p>
          </div>
        )}
      </div>

      {/* Toggle actif/inactif */}
      {!expire && !epuise && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-muted text-sm">
            {code.isActive ? 'Code activé' : 'Code désactivé'}
          </span>
          <button
            onClick={onToggle}
            className={`relative w-11 h-6 rounded-full transition-colors
                        ${code.isActive ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                          transition-transform
                          ${code.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PageCodesPromo() {
  const [codes,      setCodes]      = useState<CodePromo[]>([]);
  const [planType,   setPlanType]   = useState<'basic' | 'premium'>('basic');
  const [chargement, setChargement] = useState(true);
  const [modal,      setModal]      = useState(false);
  const [suppression,setSuppression]= useState<string | null>(null);
  const [copied,     setCopied]     = useState<string | null>(null);

  // -- Chargement --
  const charger = async () => {
    try {
      const token = localStorage.getItem('token');

      const [shopRes, promosRes] = await Promise.all([
        fetch(`${API}/shops/me`,  { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/promos`,    { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const shopData   = await shopRes.json();
      const promosData = await promosRes.json();

      if (shopData.success)   setPlanType(shopData.data.planType);
      if (promosData.success) setCodes(promosData.data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  // -- Copier code --
  const copier = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // -- Toggle actif --
  const toggleActif = async (code: CodePromo) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/promos/${code._id}`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !code.isActive }),
    });
    charger();
  };

  // -- Supprimer --
  const supprimer = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/promos/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSuppression(null);
    charger();
  };

  // ---------------------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // -- Mur Premium --
  if (planType !== 'premium') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20
                        flex items-center justify-center">
          <Lock size={36} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold">Codes promo</h1>
          <p className="text-muted mt-2 max-w-sm">
            Crée des codes de réduction pour tes clients en passant au plan Premium.
          </p>
        </div>
        <Link
          href="/dashboard/parametres/abonnement"
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold
                     px-6 py-3 rounded-xl transition-colors"
        >
          Passer en Premium →
        </Link>
      </div>
    );
  }

  const codesActifs  = codes.filter(c => c.isActive);
  const codesInactifs = codes.filter(c => !c.isActive);

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Codes promo</h1>
          <p className="text-muted text-sm mt-1">
            {codes.length} code{codes.length > 1 ? 's' : ''} —{' '}
            {codesActifs.length} actif{codesActifs.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover
                     text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          Nouveau code
        </button>
      </div>

      {/* Liste codes */}
      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3
                        bg-surface border border-border rounded-2xl">
          <Tag size={36} className="text-muted" />
          <p className="text-muted">Aucun code promo pour l'instant</p>
          <button
            onClick={() => setModal(true)}
            className="text-primary text-sm hover:underline"
          >
            Créer ton premier code →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {codes.map(code => (
            <CarteCodePromo
              key={code._id}
              code={code}
              onToggle={() => toggleActif(code)}
              onDelete={() => setSuppression(code._id)}
              onCopy={() => copier(code._id, code.code)}
              copied={copied === code._id}
            />
          ))}
        </div>
      )}

      {/* Modal création */}
      {modal && (
        <ModalCodePromo
          onClose={() => setModal(false)}
          onSave={charger}
        />
      )}

      {/* Modal confirmation suppression */}
      {suppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-white font-semibold">Supprimer ce code ?</h2>
            <p className="text-muted text-sm">
              Ce code promo sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSuppression(null)}
                className="flex-1 py-3 rounded-xl border border-border text-muted
                           hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => supprimer(suppression)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600
                           text-white font-semibold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}