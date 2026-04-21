'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2, Save, X, ImagePlus, Plus, Trash2 } from 'lucide-react';

interface Categorie { _id: string; name: string; icon: string; }

export default function EditProduitPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { token, shop } = useAuth();

  const isPremium = shop?.planType === 'premium';

  const [isLoading,   setIsLoading]   = useState(true);
  const [isSaving,    setIsSaving]    = useState(false);
  const [erreur,      setErreur]      = useState('');
  const [categories,  setCategories]  = useState<Categorie[]>([]);
  const [uploading,   setUploading]   = useState(false);

  // Champs
  const [nom,         setNom]         = useState('');
  const [description, setDescription] = useState('');
  const [prix,        setPrix]        = useState('');
  const [prixCompare, setPrixCompare] = useState('');
  const [categoryId,  setCategoryId]  = useState('');
  const [stock,       setStock]       = useState('0');
  const [statut,      setStatut]      = useState<'active' | 'draft' | 'out_of_stock'>('draft');
  const [images,      setImages]      = useState<string[]>([]);

  // Charge le produit
  useEffect(() => {
    const fetchProduit = async () => {
      if (!token || !id) return;
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/shop/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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

  // Upload images
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.slice(0, isPremium ? files.length : 5 - images.length)
           .forEach((f) => formData.append('files', f));

      const res    = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/products`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const result = await res.json();
      if (result.success) setImages((prev) => [...prev, ...result.data.urls]);
    } finally {
      setUploading(false);
    }
  };

  // Sauvegarde
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`,
        {
          method:  'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:        nom,
            description,
            price:       Number(prix),
            comparePrice: prixCompare ? Number(prixCompare) : undefined,
            categoryId:  categoryId || undefined,
            totalStock:  Number(stock),
            status:      statut,
            images,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) { setErreur(result.message ?? 'Erreur'); return; }
      router.push('/dashboard/produits');
    } catch { setErreur('Erreur réseau'); }
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
        <Link href="/dashboard/produits" className="w-9 h-9 flex items-center justify-center bg-elevated border border-border rounded-xl text-muted hover:text-white transition-colors">
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

        {/* Infos générales */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Informations générales</h2>
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
            <label className="text-white text-sm font-medium">Catégorie</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
              <option value="">Sans catégorie</option>
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
              <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Prix barré</label>
              <input type="number" value={prixCompare} onChange={(e) => setPrixCompare(e.target.value)}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
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

        {/* Stock */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Stock</h2>
          <div className="space-y-1.5">
            <label className="text-white text-sm font-medium">Quantité</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
          </div>
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
                {s === 'active' ? '✅ Publié' : s === 'draft' ? '📝 Brouillon' : '❌ Rupture'}
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