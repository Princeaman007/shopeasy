'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface Avis {
  _id:         string;
  nomClient:   string;
  note:        number;
  commentaire: string;
  createdAt:   string;
}

interface Props {
  shopSlug:  string;
  productId?: string;
  type:      'produit' | 'boutique';
  accent:    string;
  surface:   string;
  border:    string;
  text:      string;
  muted:     string;
  refresh?:  number;
}

export default function ListeAvis({
  shopSlug, productId, type, accent, surface, border, text, muted, refresh
}: Props) {
  const [avis,    setAvis]    = useState<Avis[]>([]);
  const [moyenne, setMoyenne] = useState(0);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type });
        if (productId) params.set('productId', productId);
        const res  = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reviews/public/${shopSlug}?${params}`
        );
        const data = await res.json();
        if (data.success) {
          setAvis(data.data);
          setMoyenne(data.moyenne);
          setTotal(data.total);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetch_();
  }, [shopSlug, productId, type, refresh]);

  const EtoilesAffichage = ({ note, size = 14 }: { note: number; size?: number }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          fill={note >= i ? accent : 'none'}
          stroke={note >= i ? accent : muted}
          strokeWidth={1.5} />
      ))}
    </div>
  );

  if (loading) return (
    <div className="py-6 text-center">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
           style={{ borderColor: accent }} />
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Résumé notes */}
      {total > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border"
             style={{ backgroundColor: surface, borderColor: border }}>
          <div className="text-center">
            <p className="text-4xl font-extrabold" style={{ color: accent }}>{moyenne}</p>
            <EtoilesAffichage note={Math.round(moyenne)} size={16} />
            <p className="text-xs mt-1" style={{ color: muted }}>
              {total} avis
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(n => {
              const count  = avis.filter(a => a.note === n).length;
              const pct    = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-xs w-3" style={{ color: muted }}>{n}</span>
                  <Star size={10} fill={accent} stroke={accent} />
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                       style={{ backgroundColor: border }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${pct}%`, backgroundColor: accent }} />
                  </div>
                  <span className="text-xs w-4" style={{ color: muted }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste avis */}
      {avis.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <MessageSquare size={32} className="mx-auto opacity-30" style={{ color: muted }} />
          <p className="text-sm" style={{ color: muted }}>
            Aucun avis pour l'instant — soyez le premier !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {avis.map(a => (
            <div key={a._id} className="p-4 rounded-2xl border space-y-2"
                 style={{ backgroundColor: surface, borderColor: border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                       style={{ backgroundColor: `${accent}20`, color: accent }}>
                    {a.nomClient.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: text }}>
                      {a.nomClient}
                    </p>
                    <p className="text-xs" style={{ color: muted }}>
                      {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <EtoilesAffichage note={a.note} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: muted }}>
                {a.commentaire}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}