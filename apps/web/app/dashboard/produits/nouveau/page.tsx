'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Plus, Trash2, Loader2,
  ImagePlus, X, GripVertical,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Categorie {
  _id:  string;
  name: string;
  icon: string;
}

interface VarianteForm {
  type:    string;
  label:   string;
  options: string[];
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function NouveauProduitPage() {
  const router      = useRouter();
  const { token, shop } = useAuth();

  const isPremium = shop?.planType === 'premium';

  // ── État du formulaire ──
  const [nom,          setNom]          = useState('');
  const [description,  setDescription]  = useState('');
  const [prix,         setPrix]         = useState('');
  const [prixCompare,  setPrixCompare]  = useState('');
  const [categoryId,   setCategoryId]   = useState('');
  const [stock,        setStock]        = useState('0');
  const [statut,       setStatut]       = useState<'active' | 'draft'>('draft');
  const [hasVariants,  setHasVariants]  = useState(false);
  const [variantes,    setVariantes]    = useState<VarianteForm[]>([]);
  const [categories,   setCategories]   = useState<Categorie[]>([]);
  const [images,       setImages]       = useState<string[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [erreur,       setErreur]       = useState('');

  // ── Chargement catégories ──
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories/shop/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (result.success) setCategories(result.data);
      } catch (error) {
        console.error('Erreur catégories :', error);
      }
    };
    fetchCategories();
  }, [token]);

  // ── Upload images ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Limite photos Basic
    const maxPhotos  = isPremium ? Infinity : 5;
    const remaining  = maxPhotos - images.length;
    const filesToUpload = files.slice(0, remaining);

    if (filesToUpload.length === 0) {
      setErreur('Plan Basic : maximum 5 photos par produit');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => formData.append('files', file));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/products`,
        {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        }
      );

      const result = await response.json();
      if (result.success) {
        setImages((prev) => [...prev, ...result.data.urls]);
      }
    } catch (error) {
      setErreur('Erreur upload images');
    } finally {
      setUploading(false);
    }
  };

  // ── Ajouter une variante ──
  const ajouterVariante = () => {
    setVariantes((prev) => [
      ...prev,
      { type: 'Taille', label: 'Taille', options: [] },
    ]);
  };

  // ── Modifier une variante ──
  const modifierVariante = (
    index: number,
    champ: keyof VarianteForm,
    valeur: string | string[]
  ) => {
    setVariantes((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [champ]: valeur } : v))
    );
  };

  // ── Ajouter option à une variante ──
  const ajouterOption = (index: number, option: string) => {
    if (!option.trim()) return;
    setVariantes((prev) =>
      prev.map((v, i) =>
        i === index
          ? { ...v, options: [...v.options, option.trim()] }
          : v
      )
    );
  };

  // ── Supprimer option ──
  const supprimerOption = (varianteIndex: number, optionIndex: number) => {
    setVariantes((prev) =>
      prev.map((v, i) =>
        i === varianteIndex
          ? { ...v, options: v.options.filter((_, j) => j !== optionIndex) }
          : v
      )
    );
  };

  // ── Soumission ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    if (!nom.trim()) { setErreur('Le nom est obligatoire'); return; }
    if (!prix || Number(prix) <= 0) { setErreur('Le prix est obligatoire'); return; }

    setIsLoading(true);
    try {
      const body: any = {
        name:        nom,
        description,
        price:       Number(prix),
        comparePrice: prixCompare ? Number(prixCompare) : undefined,
        categoryId:  categoryId || undefined,
        totalStock:  hasVariants ? undefined : Number(stock),
        status:      statut,
        images,
        hasVariants,
        variants:    hasVariants ? variantes : [],
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
        {
          method:  'POST',
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErreur(result.message ?? 'Erreur création produit');
        return;
      }

      router.push('/dashboard/produits');
    } catch (error) {
      setErreur('Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/produits"
          className="w-9 h-9 flex items-center justify-center bg-elevated border border-border rounded-xl text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouveau produit</h1>
          <p className="text-muted text-sm">Remplissez les informations de votre produit</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{erreur}</p>
          </div>
        )}

        {/* ── Infos générales ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Informations générales</h2>

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Nom du produit *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Robe Wax Élégante"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={4}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Catégorie</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Sans catégorie</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Prix ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Prix</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Prix de vente *</label>
              <div className="relative">
                <input
                  type="number"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  placeholder="15000"
                  min="0"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                  FCFA
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Prix barré (optionnel)</label>
              <div className="relative">
                <input
                  type="number"
                  value={prixCompare}
                  onChange={(e) => setPrixCompare(e.target.value)}
                  placeholder="20000"
                  min="0"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                  FCFA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Images ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">
              Photos {!isPremium && `(${images.length}/5)`}
            </h2>
            {!isPremium && (
              <span className="text-muted text-xs">Plan Basic : max 5 photos</span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}

            {/* Bouton upload */}
            {(isPremium || images.length < 5) && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors bg-elevated hover:bg-elevated/80">
                {uploading ? (
                  <Loader2 size={20} className="text-primary animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={20} className="text-muted" />
                    <span className="text-muted text-xs text-center">Ajouter</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* ── Stock ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Stock & Variantes</h2>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasVariants(!hasVariants)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                hasVariants ? 'bg-primary' : 'bg-elevated border border-border'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                hasVariants ? 'left-5' : 'left-0.5'
              }`} />
            </button>
            <label className="text-white text-sm">
              Ce produit a des variantes (tailles, couleurs...)
            </label>
          </div>

          {!hasVariants && (
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Quantité en stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          {/* Variantes */}
          {hasVariants && (
            <div className="space-y-4">
              {variantes.map((variante, index) => (
                <div key={index} className="bg-elevated border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-muted" />
                    <input
                      type="text"
                      value={variante.label}
                      onChange={(e) => modifierVariante(index, 'label', e.target.value)}
                      placeholder="Ex: Taille, Couleur..."
                      className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setVariantes((prev) => prev.filter((_, i) => i !== index))}
                      className="text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="flex flex-wrap gap-2">
                    {variante.options.map((opt, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1 bg-bg border border-border rounded-lg px-2 py-1 text-white text-xs"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => supprimerOption(index, j)}
                          className="text-muted hover:text-red-400"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Ajouter option + Entrée"
                      className="bg-bg border border-border rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-primary w-40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          ajouterOption(index, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={ajouterVariante}
                className="flex items-center gap-2 text-primary hover:text-primary-hover text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Ajouter une variante
              </button>
            </div>
          )}
        </div>

        {/* ── Statut ── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-white font-semibold">Statut de publication</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['active', 'draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatut(s)}
                className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                  statut === s
                    ? 'bg-primary border-primary text-black'
                    : 'bg-elevated border-border text-muted hover:text-white'
                }`}
              >
                {s === 'active' ? '✅ Publié' : '📝 Brouillon'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Boutons ── */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/produits"
            className="flex-1 text-center bg-elevated hover:bg-border border border-border text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Créer le produit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}