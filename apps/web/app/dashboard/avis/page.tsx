'use client';

import { useState, useEffect } from 'react';
import { useAuth }  from '@/contexts/AuthContext';
import { Star, Check, X, Trash2, MessageSquare, Loader2 } from 'lucide-react';

interface Avis {
  _id:         string;
  nomClient:   string;
  note:        number;
  commentaire: string;
  type:        'produit' | 'boutique';
  statut:      'pending' | 'approved' | 'rejected';
  createdAt:   string;
}

export default function AvisPage() {
  const { token }               = useAuth();
  const [avis,     setAvis]     = useState<Avis[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filtre,   setFiltre]   = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const charger = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = filtre !== 'all' ? `?statut=${filtre}` : '';
      const res    = await fetch(`/api/reviews/me${params}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const data   = await res.json();
      if (data.success) setAvis(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, [token, filtre]);

  const action = async (id: string, statut: 'approved' | 'rejected') => {
    await fetch(`/api/reviews/${id}`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }) });
    charger();
  };

  const supprimer = async (id: string) => {
    await fetch(`/api/reviews/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    charger();
  };

  const Etoiles = ({ note }: { note: number }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14}
          fill={note >= i ? '#f59e0b' : 'none'}
          stroke={note >= i ? '#f59e0b' : '#6b7280'}
          strokeWidth={1.5} />
      ))}
    </div>
  );

  const avisFiltres = filtre === 'all' ? avis : avis.filter(a => a.statut === filtre);
  const nbPending   = avis.filter(a => a.statut === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare size={24} className="text-primary" />
          Avis clients
          {nbPending > 0 && (
            <span className="text-xs bg-primary text-black font-bold px-2 py-0.5 rounded-full">
              {nbPending} en attente
            </span>
          )}
        </h1>
        <p className="text-muted text-sm mt-1">
          Moderez les avis de votre boutique et de vos produits
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {([
          { val: 'pending',  label: 'En attente', color: '#f59e0b' },
          { val: 'approved', label: 'Approuves',  color: '#10b981' },
          { val: 'rejected', label: 'Rejetes',    color: '#ef4444' },
          { val: 'all',      label: 'Tous',       color: '#6b7280' },
        ] as const).map(f => (
          <button key={f.val} onClick={() => setFiltre(f.val)}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{
              backgroundColor: filtre === f.val ? `${f.color}20` : 'transparent',
              borderColor:     filtre === f.val ? f.color : '#374151',
              color:           filtre === f.val ? f.color : '#9ca3af',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      ) : avisFiltres.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={40} className="mx-auto text-muted opacity-30 mb-3" />
          <p className="text-muted">Aucun avis dans cette categorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {avisFiltres.map(a => (
            <div key={a._id} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{a.nomClient}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.type === 'boutique'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {a.type === 'boutique' ? 'Boutique' : 'Produit'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.statut === 'pending'  ? 'bg-yellow-500/20 text-yellow-400' :
                      a.statut === 'approved' ? 'bg-green-500/20  text-green-400'  :
                                                'bg-red-500/20    text-red-400'
                    }`}>
                      {a.statut === 'pending' ? 'En attente' : a.statut === 'approved' ? 'Approuve' : 'Rejete'}
                    </span>
                  </div>
                  <Etoiles note={a.note} />
                  <p className="text-sm text-muted">{a.commentaire}</p>
                  <p className="text-xs text-muted">
                    {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.statut === 'pending' && (
                    <>
                      <button onClick={() => action(a._id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors">
                        <Check size={14} /> Approuver
                      </button>
                      <button onClick={() => action(a._id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors">
                        <X size={14} /> Rejeter
                      </button>
                    </>
                  )}
                  {a.statut !== 'pending' && (
                    <button onClick={() => action(a._id, a.statut === 'approved' ? 'rejected' : 'approved')}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-border text-muted hover:text-white transition-colors">
                      {a.statut === 'approved' ? 'Rejeter' : 'Approuver'}
                    </button>
                  )}
                  <button onClick={() => supprimer(a._id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}