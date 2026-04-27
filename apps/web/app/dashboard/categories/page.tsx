'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, ChevronRight, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Categorie {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  predefined: boolean;
  parentId: string | null;
  sousCategories?: Categorie[];
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;



// ---------------------------------------------------------------------------
// Composant modal — créer / modifier une catégorie
// ---------------------------------------------------------------------------
function ModalCategorie({
  categorie,
  parentOptions,
  onClose,
  onSave,
}: {
  categorie?: Categorie | null;
  parentOptions: Categorie[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [nom,      setNom]      = useState(categorie?.name     ?? '');
  const [parentId, setParentId] = useState(categorie?.parentId ?? '');
  const [loading,  setLoading]  = useState(false);
  const [erreur,   setErreur]   = useState('');

  const estModification = !!categorie?._id && !categorie.predefined;

  const sauvegarder = async () => {
    if (!nom.trim()) { setErreur('Le nom est obligatoire'); return; }
    setLoading(true);
    setErreur('');

    try {
      const token = localStorage.getItem('token');
      const url    = estModification
        ? `${API}/categories/${categorie._id}`
        : `${API}/categories`;
      const method = estModification ? 'PATCH'  : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
       body: JSON.stringify({
          name:     nom.trim(),
          icon:     '📦',
          parentId: parentId || null,
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
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-5">

        {/* En-tête */}
        <h2 className="text-white font-semibold text-lg">
          {estModification ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        </h2>

        {/* Nom */}
        <div className="space-y-1">
          <label className="text-muted text-sm">Nom *</label>
          <input
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Ex : Robes d'été"
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

      

        {/* Catégorie parente (sous-catégorie) */}
        <div className="space-y-1">
          <label className="text-muted text-sm">Sous-catégorie de (optionnel)</label>
          <select
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            className="w-full bg-elevated border border-border rounded-xl px-4 py-3
                       text-white focus:outline-none focus:border-primary"
          >
            <option value="">— Catégorie principale —</option>
            {parentOptions.map(p => (
              <option key={p._id} value={p._id}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Erreur */}
        {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-muted
                       hover:text-white hover:border-white/30 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={sauvegarder}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover
                       text-white font-semibold transition-colors disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {estModification ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ligne catégorie
// ---------------------------------------------------------------------------
function LigneCategorie({
  cat,
  niveau,
  onEdit,
  onDelete,
  onAddSub,
}: {
  cat: Categorie;
  niveau: number;
  onEdit: (c: Categorie) => void;
  onDelete: (c: Categorie) => void;
  onAddSub: (c: Categorie) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const aSousCats = (cat.sousCategories?.length ?? 0) > 0;

  return (
    <>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
                    ${cat.predefined
                      ? 'bg-elevated/50 border-border/50'
                      : 'bg-elevated border-border hover:border-primary/30'}`}
        style={{ marginLeft: niveau * 20 }}
      >
        {/* Grip */}
        <GripVertical size={16} className="text-muted/50 flex-shrink-0" />

        {/* Icône + nom */}
        <span className="text-xl">{cat.icon}</span>
        <span className="text-white flex-1 font-medium">{cat.name}</span>

        {/* Badge prédéfini */}
        {cat.predefined && (
          <span className="text-xs text-muted bg-elevated border border-border
                           px-2 py-0.5 rounded-full">
            Prédéfinie
          </span>
        )}

        {/* Sous-catégories toggle */}
        {aSousCats && (
          <button
            onClick={() => setOuvert(!ouvert)}
            className="text-muted hover:text-white transition-colors"
          >
            <ChevronRight
              size={16}
              className={`transition-transform ${ouvert ? 'rotate-90' : ''}`}
            />
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Ajouter sous-catégorie */}
          <button
            onClick={() => onAddSub(cat)}
            title="Ajouter une sous-catégorie"
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus size={14} />
          </button>

          {/* Modifier (pas les prédéfinies) */}
          {!cat.predefined && (
            <button
              onClick={() => onEdit(cat)}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-muted hover:text-white hover:bg-elevated transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}

          {/* Supprimer (pas les prédéfinies) */}
          {!cat.predefined && (
            <button
              onClick={() => onDelete(cat)}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Sous-catégories */}
      {ouvert && aSousCats && cat.sousCategories!.map(sub => (
        <LigneCategorie
          key={sub._id}
          cat={sub}
          niveau={niveau + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSub={onAddSub}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PageCategories() {
  const [categories,    setCategories]    = useState<Categorie[]>([]);
  const [chargement,    setChargement]    = useState(true);
  const [modalOuvert,   setModalOuvert]   = useState(false);
  const [catSelectee,   setCatSelectee]   = useState<Categorie | null>(null);
  const [parentPreSet,  setParentPreSet]  = useState<string>('');
  const [suppression,   setSuppression]   = useState<Categorie | null>(null);
  const [loadingSuppr,  setLoadingSuppr]  = useState(false);

  // -- Chargement --
  const charger = async () => {
  setChargement(true);
  try {
    const token = localStorage.getItem('token');
    const res   = await fetch(`${API}/categories/shop/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setCategories(construireArbre(data.data)); // ← data.data
  } finally {
    setChargement(false);
  }
};

  useEffect(() => { charger(); }, []);

  // -- Construire l'arbre parent/enfants --
  const construireArbre = (liste: Categorie[]): Categorie[] => {
    const map = new Map<string, Categorie>();
    liste.forEach(c => map.set(c._id, { ...c, sousCategories: [] }));
    const racines: Categorie[] = [];
    map.forEach(c => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.sousCategories!.push(c);
      } else {
        racines.push(c);
      }
    });
    return racines.sort((a, b) => a.order - b.order);
  };

  // -- Catégories racines uniquement (pour le select parent) --
  const categoriesRacines = categories.filter(c => !c.parentId);

  // -- Ouvrir modal création --
  const ouvrirCreation = () => {
    setCatSelectee(null);
    setParentPreSet('');
    setModalOuvert(true);
  };

  // -- Ouvrir modal sous-catégorie --
  const ouvrirSousCategorie = (parent: Categorie) => {
    setCatSelectee({ ...({} as Categorie), parentId: parent._id } as Categorie);
    setParentPreSet(parent._id);
    setModalOuvert(true);
  };

  // -- Supprimer --
  const confirmerSuppression = async () => {
    if (!suppression) return;
    setLoadingSuppr(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/categories/${suppression._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppression(null);
      charger();
    } finally {
      setLoadingSuppr(false);
    }
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Catégories</h1>
          <p className="text-muted text-sm mt-1">
            Organise tes produits pour faciliter la navigation
          </p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover
                     text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          Nouvelle catégorie
        </button>
      </div>

      {/* Contenu */}
      {chargement ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">

          {/* Info prédéfinies */}
          <p className="text-muted text-xs px-2 pb-2 border-b border-border">
            Les catégories <span className="text-white">prédéfinies</span> ne peuvent
            pas être supprimées. Tu peux ajouter des sous-catégories à n'importe quelle catégorie.
          </p>

          {categories.length === 0 ? (
            <p className="text-muted text-center py-10">Aucune catégorie pour l'instant.</p>
          ) : (
            categories.map(cat => (
              <LigneCategorie
                key={cat._id}
                cat={cat}
                niveau={0}
                onEdit={c => { setCatSelectee(c); setModalOuvert(true); }}
                onDelete={c => setSuppression(c)}
                onAddSub={ouvrirSousCategorie}
              />
            ))
          )}
        </div>
      )}

      {/* Modal création / modification */}
      {modalOuvert && (
        <ModalCategorie
          categorie={catSelectee}
          parentOptions={categoriesRacines}
          onClose={() => setModalOuvert(false)}
          onSave={charger}
        />
      )}

      {/* Modal confirmation suppression */}
      {suppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Supprimer la catégorie ?</h2>
            <p className="text-muted text-sm">
              <span className="text-white font-medium">
                {suppression.icon} {suppression.name}
              </span>{' '}
              sera supprimée. Les produits associés ne seront pas supprimés mais
              perdront leur catégorie.
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
                onClick={confirmerSuppression}
                disabled={loadingSuppr}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600
                           text-white font-semibold transition-colors disabled:opacity-50
                           flex items-center justify-center gap-2"
              >
                {loadingSuppr && <Loader2 size={16} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}