'use client';

import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';

interface Props {
  shopSlug:  string;
  productId?: string;
  type:      'produit' | 'boutique';
  accent:    string;
  bg:        string;
  surface:   string;
  border:    string;
  text:      string;
  muted:     string;
  onSuccess?: () => void;
}

export default function FormulaireAvis({
  shopSlug, productId, type, accent, bg, surface, border, text, muted, onSuccess
}: Props) {
  const [nom,         setNom]         = useState('');
  const [note,        setNote]        = useState(0);
  const [survol,      setSurvol]      = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [succes,      setSucces]      = useState(false);
  const [erreur,      setErreur]      = useState('');

  const soumettre = async () => {
    if (!nom.trim())         { setErreur('Votre nom est obligatoire'); return; }
    if (note === 0)          { setErreur('Veuillez donner une note'); return; }
    if (!commentaire.trim()) { setErreur('Votre commentaire est obligatoire'); return; }

    setLoading(true);
    setErreur('');
    try {
      const res = await fetch(`/backend/reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          shopSlug, productId, type,
          nomClient:   nom.trim(),
          note,
          commentaire: commentaire.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSucces(true);
      setNom(''); setNote(0); setCommentaire('');
      onSuccess?.();
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (succes) {
    return (
      <div className="p-4 rounded-2xl border text-center space-y-2"
           style={{ backgroundColor: `${accent}10`, borderColor: `${accent}30` }}>
        <p className="text-2xl">🎉</p>
        <p className="font-semibold text-sm" style={{ color: accent }}>
          Merci pour votre avis !
        </p>
        <p className="text-xs" style={{ color: muted }}>
          Votre avis est en attente de validation par le marchand.
        </p>
        <button onClick={() => setSucces(false)}
          className="text-xs underline" style={{ color: muted }}>
          Laisser un autre avis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm" style={{ color: text }}>
        Laisser un avis
      </h3>

      {/* Note etoiles */}
      <div className="space-y-1.5">
        <p className="text-xs" style={{ color: muted }}>Votre note *</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button key={i}
              onClick={() => setNote(i)}
              onMouseEnter={() => setSurvol(i)}
              onMouseLeave={() => setSurvol(0)}
              className="transition-transform hover:scale-110">
              <Star
                size={24}
                fill={(survol || note) >= i ? accent : 'none'}
                stroke={(survol || note) >= i ? accent : muted}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Nom */}
      <div className="space-y-1.5">
        <label className="text-xs" style={{ color: muted }}>Votre nom *</label>
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Aminata K."
          className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: bg, borderColor: border, color: text }}
        />
      </div>

      {/* Commentaire */}
      <div className="space-y-1.5">
        <label className="text-xs" style={{ color: muted }}>Votre commentaire *</label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder="Partagez votre experience..."
          rows={3}
          maxLength={500}
          className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          style={{ backgroundColor: bg, borderColor: border, color: text }}
        />
        <p className="text-xs text-right" style={{ color: muted }}>
          {commentaire.length}/500
        </p>
      </div>

      {erreur && (
        <p className="text-xs text-red-400">{erreur}</p>
      )}

      <button onClick={soumettre} disabled={loading}
        className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: accent, color: '#fff' }}>
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Envoi...</>
          : <><Send size={16} /> Soumettre mon avis</>
        }
      </button>
    </div>
  );
}