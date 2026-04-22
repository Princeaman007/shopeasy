import { StatutCommande } from '@/hooks/useClientOrders';

const CONFIG: Record<StatutCommande, { label: string; classe: string; emoji: string }> = {
  new:       { label: 'Nouvelle',      emoji: '🆕', classe: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  confirmed: { label: 'Confirmée',     emoji: '✅', classe: 'bg-primary/10 text-primary border-primary/20' },
  shipping:  { label: 'En livraison',  emoji: '🚚', classe: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  delivered: { label: 'Livrée',        emoji: '📦', classe: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Annulée',       emoji: '❌', classe: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function StatutBadge({
  statut,
  taille = 'md',
}: {
  statut: StatutCommande;
  taille?: 'sm' | 'md';
}) {
  const c = CONFIG[statut];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${c.classe} ${taille === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
      {c.emoji} {c.label}
    </span>
  );
}