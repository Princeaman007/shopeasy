'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2, Save, X, ImagePlus, Plus, Trash2, GripVertical } from 'lucide-react';

interface Categorie { _id: string; name: string; icon: string; }

interface VarianteForm {
  type:    string;
  label:   string;
  options: string[];
  images:  Record<string, string[]>;
}

interface SkuForm {
  sku:      string;
  quantity: number;
  price?:   number;
}

function genererCombinaisons(variantes: VarianteForm[]): string[] {
  const optionsParVariante = variantes
    .filter(v => v.options.length > 0)
    .map(v => v.options);
  if (optionsParVariante.length === 0) return [];
  const combiner = (arrays: string[][]): string[] => {
    if (arrays.length === 0) return [''];
    if (arrays.length === 1) return arrays[0];
    const reste = combiner(arrays.slice(1));
    return arrays[0].flatMap(item => reste.map(r => r ? `${item}-${r}` : item));
  };
  return combiner(optionsParVariante);
}

export default function EditProduitPage() {
  const { id }          = useParams<{ id: string }>();
  const router          = useRouter();
  const { token, shop } = useAuth();
  const isPremium       = shop?.planType === 'premium';

  const [isLoading,   setIsLoading]   = useState(true);
  const [isSaving,    setIsSaving]    = useState(false);
  const [erreur,      setErreur]      = useState('');
  const [categories,  setCategories]  = useState<Categorie[]>([]);
  const [uploading,   setUploading]   = useState(false);

  const [nom,         setNom]         = useState('');
  const [description, setDescription] = useState('');
  const [prix,        setPrix]        = useState('');
  const [prixCompare, setPrixCompare] = useState('');
  const [categoryId,  setCategoryId]  = useState('');
  const [stock,       setStock]       = useState('0');
  const [statut,      setStatut]      = useState<'active' | 'draft' | 'out_of_stock'>('draft');
  const [images,      setImages]      = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantes,   setVariantes]   = useState<VarianteForm[]>([]);
  const [skus,        setSkus]        = useState<SkuForm[]>([]);

  useEffect(() => {
    if (!hasVariants || variantes.length === 0) { setSkus([]); return; }
    const combinaisons = genererCombinaisons(variantes);
    setSkus(prev => combinaisons.map(sku => {
      const existant = prev.find(s => s.sku === sku);
      return existant ?? { sku, quantity: 0 };
    }));
  }, [variantes, hasVariants]);

  useEffect(() => {
    const fetchProduit = async () => {
      if (!token || !id) return;
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/categories/shop/me`,
            { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const prodResult = await prodRes.json();
        const catResult  = await catRes.json();

        if (prodResult.success) {
          const p = prodResult.data;
          setNom(p.name);
          setDescription(p.description ?? '');
          setPrix(String(p.price));
          setPrixCompare(p.comparePrice ? String(p.comparePrice) : '');
          setCategoryId(p.categoryId ?? '');
          setStock(String(p.totalStock));
          setStatut(p.status);
          setImages(p.images ?? []);
          setHasVariants(p.hasVariants ?? false);
          if (p.variants?.length > 0) {
            setVariantes(p.variants.map((v: any) => ({
              type:    v.type   ?? v.label ?? '',
              label:   v.label  ?? v.type  ?? '',
              options: v.options ?? [],
              images:  v.images  ?? {},
            })));
          }
          if (p.stock?.length > 0) {
            setSkus(p.stock.map((s: any) => ({
              sku:      s.sku,
              quantity: s.quantity,
              price:    s.price ?? undefined,
            })));
          }
        }
        if (catResult.success) setCategories(catResult.data);
      } catch (error) {
        console.error('Erreur chargement produit :', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduit();
  }, [token, id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.slice(0, isPremium ? files.length : 5 - images.length)
           .forEach((f) => formData.append('files', f));
      const res    = await fetch(`/api/uploads/products`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const result = await res.json();
      if (result.success) setImages((prev) => [...prev, ...result.data.urls]);
    } finally { setUploading(false); }
  };

  const ajouterVariante = () => {
    setVariantes((prev) => [...prev, { type: 'Taille', label: 'Taille', options: [], images: {} }]);
  };

  const modifierVariante = (index: number, champ: keyof VarianteForm, valeur: any) => {
    setVariantes((prev) => prev.map((v, i) => (i === index ? { ...v, [champ]: valeur } : v)));
  };

  const ajouterOption = (index: number, option: string) => {
    if (!option.trim()) return;
    setVariantes((prev) =>
      prev.map((v, i) => i === index ? { ...v, options: [...v.options, option.trim()] } : v)
    );
  };

  const supprimerOption = (varianteIndex: number, optionIndex: number) => {
    setVariantes((prev) =>
      prev.map((v, i) =>
        i === varianteIndex ? { ...v, options: v.options.filter((_, j) => j !== optionIndex) } : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${id}`,
        {
          method:  'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:         nom,
            description,
            price:        Number(prix),
            comparePrice: prixCompare ? Number(prixCompare) : undefined,
            categoryId:   categoryId || undefined,
            status:       statut,
            images,
            hasVariants,
            variants:     hasVariants ? variantes.map(v => ({
              type:    v.label,
              label:   v.label,
              options: v.options,
              images:  v.images,
            })) : [],
            stock:      hasVariants ? skus : [],
            totalStock: hasVariants
              ? skus.reduce((s, sku) => s + sku.quantity, 0)
              : Number(stock),
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) { setErreur(result.message ?? 'Erreur'); return; }
      router.push('/dashboard/produits');
    } catch { setErreur('Erreur reseau'); }
    finally  { setIsSaving(false); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="text-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/produits"
          className="w-9 h-9 flex items-center justify-center bg-elevated border border-border rounded-xl text-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Modifier le produit</h1>
          <p className="text-muted text-sm">{nom}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{erreur}</p>
          </div>
        )}

        {/* Infos generales */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Informations generales</h2>
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Nom *</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4} className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Categorie</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
              <option value="">Sans categorie</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prix */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Prix</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Prix de vente *</label>
              <div className="relative">
                <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} min="0"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors pr-16" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">FCFA</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Prix barre</label>
              <div className="relative">
                <input type="number" value={prixCompare} onChange={(e) => setPrixCompare(e.target.value)} min="0"
                  className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors pr-16" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">FCFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Photos {!isPremium && `(${images.length}/5)`}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">Principal</div>
                )}
              </div>
            ))}
            {(isPremium || images.length < 5) && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors bg-elevated">
                {uploading ? <Loader2 size={20} className="text-primary animate-spin" /> : <ImagePlus size={20} className="text-muted" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        {/* Stock & Variantes */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Stock & Variantes</h2>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setHasVariants(!hasVariants)}
              className={`w-11 h-6 rounded-full transition-colors relative ${hasVariants ? 'bg-primary' : 'bg-elevated border border-border'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${hasVariants ? 'left-5' : 'left-0.5'}`} />
            </button>
            <label className="text-white text-sm">Ce produit a des variantes (tailles, couleurs...)</label>
          </div>

          {!hasVariants && (
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Quantite en stock</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0"
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
            </div>
          )}

          {hasVariants && (
            <div className="space-y-4">
              {variantes.map((variante, index) => (
                <div key={index} className="bg-elevated border border-border rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-muted" />
                    <input type="text" value={variante.label}
                      onChange={(e) => modifierVariante(index, 'label', e.target.value)}
                      placeholder="Ex: Taille, Couleur..."
                      className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
                    <button type="button" onClick={() => setVariantes((prev) => prev.filter((_, i) => i !== index))}
                      className="text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {variante.options.map((opt, j) => (
                      <span key={j} className="flex items-center gap-1 bg-bg border border-border rounded-lg px-2 py-1 text-white text-xs">
                        {opt}
                        <button type="button" onClick={() => supprimerOption(index, j)} className="text-muted hover:text-red-400">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input type="text" placeholder="Ajouter option + Entree"
                      className="bg-bg border border-border rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-primary w-40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          ajouterOption(index, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }} />
                  </div>

                  {variante.options.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-muted text-xs uppercase tracking-wide font-medium">Photos par option (optionnel)</p>
                      {variante.options.map((opt) => (
                        <div key={opt} className="space-y-2">
                          <p className="text-white text-xs font-medium">{opt}</p>
                          <div className="flex gap-2 flex-wrap">
                            {(variante.images[opt] ?? []).map((url, k) => (
                              <div key={k} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button type="button"
                                  onClick={() => {
                                    const newImages = { ...variante.images };
                                    newImages[opt] = (newImages[opt] ?? []).filter((_, i) => i !== k);
                                    modifierVariante(index, 'images', newImages);
                                  }}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                                  <X size={8} />
                                </button>
                              </div>
                            ))}
                            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center bg-bg transition-colors">
                              {uploading ? <Loader2 size={14} className="text-primary animate-spin" /> : <ImagePlus size={14} className="text-muted" />}
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files ?? []);
                                  if (!files.length) return;
                                  setUploading(true);
                                  try {
                                    const formData = new FormData();
                                    files.forEach((f) => formData.append('files', f));
                                    const res = await fetch(`/api/uploads/products`,
                                      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
                                    const result = await res.json();
                                    if (result.success) {
                                      const newImages = { ...variante.images };
                                      newImages[opt] = [...(newImages[opt] ?? []), ...result.data.urls];
                                      modifierVariante(index, 'images', newImages);
                                    }
                                  } finally { setUploading(false); }
                                }} />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={ajouterVariante}
                className="flex items-center gap-2 text-primary hover:text-primary-hover text-sm font-medium transition-colors">
                <Plus size={16} /> Ajouter une variante
              </button>

              {skus.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-sm font-semibold">Stock par combinaison</h3>
                    <span className="text-muted text-xs">{skus.length} combinaison{skus.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="bg-elevated rounded-xl border border-border overflow-hidden">
                    <div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-border">
                      <span className="text-muted text-xs font-medium uppercase tracking-wide">Combinaison</span>
                      <span className="text-muted text-xs font-medium uppercase tracking-wide">Quantite</span>
                      <span className="text-muted text-xs font-medium uppercase tracking-wide">Prix specifique</span>
                    </div>
                    {skus.map((sku, i) => (
                      <div key={sku.sku}
                        className={`grid grid-cols-3 gap-4 px-4 py-3 items-center ${i < skus.length - 1 ? 'border-b border-border' : ''}`}>
                        <span className="text-white text-sm font-mono truncate">{sku.sku}</span>
                        <input type="number" value={sku.quantity} min="0"
                          onChange={(e) => setSkus(prev => prev.map((s, j) => j === i ? { ...s, quantity: Number(e.target.value) } : s))}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors" />
                        <div className="relative">
                          <input type="number" value={sku.price ?? ''} min="0"
                            placeholder={prix || '-'}
                            onChange={(e) => setSkus(prev => prev.map((s, j) => j === i ? { ...s, price: e.target.value ? Number(e.target.value) : undefined } : s))}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors pr-12" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted text-xs">FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-muted text-sm">Stock total</span>
                    <span className="text-white font-bold">{skus.reduce((s, sku) => s + sku.quantity, 0)} unites</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statut */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-white font-semibold">Statut</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['active', 'draft', 'out_of_stock'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatut(s)}
                className={`py-3 rounded-xl text-xs font-medium border transition-all ${
                  statut === s ? 'bg-primary border-primary text-black' : 'bg-elevated border-border text-muted hover:text-white'
                }`}>
                {s === 'active' ? 'Publie' : s === 'draft' ? 'Brouillon' : 'Rupture'}
              </button>
            ))}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <Link href="/dashboard/produits"
            className="flex-1 text-center bg-elevated hover:bg-border border border-border text-white font-semibold py-3 rounded-xl transition-colors">
            Annuler
          </Link>
          <button type="submit" disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Sauvegarder</>}
          </button>
        </div>
      </form>
    </div>
  );
}