'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface Props {
  commande: any;
  shopName: string;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmt = (n: number) =>
  n.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

export default function BonLivraison({ commande, shopName }: Props) {
  const [loading, setLoading] = useState(false);

  const genererPDF = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const W = 210;
      let y = 0;

      // En-tete vert
      doc.setFillColor(6, 193, 103);
      doc.rect(0, 0, W, 42, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('BON DE LIVRAISON', W / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(shopName.toUpperCase(), W / 2, 25, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(0, 60, 30);
      doc.text('Propulse par ShopEasy CI', W / 2, 32, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Ref: ${commande.orderNumber}`, W / 2, 38, { align: 'center' });

      y = 54;

      // Infos commande
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date : ${formatDate(commande.createdAt)}`, 15, y);
      const statut =
        commande.status === 'new'       ? 'Nouvelle'     :
        commande.status === 'confirmed' ? 'Confirmee'    :
        commande.status === 'shipping'  ? 'En livraison' :
        commande.status === 'delivered' ? 'Livree'       : 'Annulee';
      doc.text(`Statut : ${statut}`, 140, y);

      y += 14;

      // Section client
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(15, y - 6, W - 30, 42, 3, 3, 'FD');
      doc.setFillColor(6, 193, 103);
      doc.roundedRect(15, y - 6, 45, 8, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('DESTINATAIRE', 18, y - 1);

      const nomClient     = commande.customer?.name    ?? commande.nomClient ?? '';
      const telClient     = commande.customer?.phone   ?? commande.telephone ?? '';
      const adresseClient = commande.customer?.address ?? commande.adresse   ?? '';
      const villeClient   = commande.customer?.city    ?? commande.ville     ?? '';

      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(nomClient, 20, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Tel: ${telClient}`, 20, y + 19);
      doc.text(`Adresse: ${adresseClient}`, 20, y + 27);
      doc.text(`Ville: ${villeClient}`, 20, y + 35);

      y += 52;

      // Tableau articles
      doc.setFillColor(6, 193, 103);
      doc.roundedRect(15, y - 6, 55, 8, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('ARTICLES COMMANDES', 18, y - 1);

      y += 6;

      doc.setFillColor(30, 30, 30);
      doc.rect(15, y - 4, W - 30, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Produit',    18,  y + 2);
      doc.text('Qte',       128,  y + 2, { align: 'center' });
      doc.text('Prix unit.', 158, y + 2, { align: 'right' });
      doc.text('Total',      193, y + 2, { align: 'right' });

      y += 10;

      commande.items.forEach((item: any, i: number) => {
        const bgColor = i % 2 === 0 ? [252, 252, 252] : [244, 244, 244];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        const rowH = item.variant ? 14 : 9;
        doc.rect(15, y - 4, W - 30, rowH, 'F');

        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const nom = item.name.length > 45 ? item.name.slice(0, 45) + '...' : item.name;
        doc.text(nom, 18, y + 1);

        if (item.variant) {
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'italic');
          doc.text(item.variant, 18, y + 7);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 30, 30);
        }

        doc.text(String(item.quantity), 128, y + 1, { align: 'center' });
        doc.text(fmt(item.price),               158, y + 1, { align: 'right' });
        doc.text(fmt(item.price * item.quantity), 193, y + 1, { align: 'right' });

        y += rowH;
      });

      doc.setDrawColor(220, 220, 220);
      doc.rect(
        15,
        y - commande.items.reduce((s: number, item: any) => s + (item.variant ? 14 : 9), 0) - 10,
        W - 30,
        commande.items.reduce((s: number, item: any) => s + (item.variant ? 14 : 9), 0) + 10,
        'S'
      );

      y += 8;

      // Recap
      const recapW    = 80;
      const recapX    = W - 15 - recapW;
      const recapRight = recapX + recapW;

      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(recapX - 5, y - 4, recapW + 10, commande.discount > 0 ? 32 : 24, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Sous-total :', recapX, y + 2);
      doc.setTextColor(20, 20, 20);
      doc.text(fmt(commande.subtotal ?? commande.total), recapRight, y + 2, { align: 'right' });

      if (commande.discount > 0) {
        y += 9;
        doc.setTextColor(80, 80, 80);
        doc.text(`Reduction${commande.promoCode ? ` (${commande.promoCode})` : ''} :`, recapX, y + 2);
        doc.setTextColor(6, 150, 80);
        doc.text(`-${fmt(commande.discount)}`, recapRight, y + 2, { align: 'right' });
      }

      y += 12;

      doc.setFillColor(6, 193, 103);
      doc.roundedRect(recapX - 5, y - 4, recapW + 10, 12, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOTAL :', recapX, y + 4);
      doc.text(fmt(commande.total), recapRight, y + 4, { align: 'right' });

      y += 22;

      // Note paiement
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(15, y, W - 30, 16, 3, 3, 'FD');
      doc.setTextColor(120, 80, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PAIEMENT A LA LIVRAISON', 20, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 70, 0);
      doc.text('Veuillez preparer le montant exact. Merci pour votre confiance !', 20, y + 12);

      y += 24;

      // Signatures
      doc.setDrawColor(200, 200, 200);
      doc.line(15,  y, 80,     y);
      doc.line(130, y, W - 15, y);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Signature client',   20,  y + 5);
      doc.text('Signature livreur', 135,  y + 5);

      // Footer
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 282, W, 15, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${shopName} · ShopEasy CI`, W / 2, 289, { align: 'center' });
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Genere le ${new Date().toLocaleDateString('fr-FR')} · ${commande.orderNumber} · shopeasyci.ci`,
        W / 2, 294, { align: 'center' }
      );

      doc.save(`bon-livraison-${commande.orderNumber}.pdf`);

    } catch (err) {
      console.error('Erreur generation PDF :', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={genererPDF} disabled={loading}
      className="flex items-center gap-2 bg-elevated hover:bg-border border border-border text-white font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-sm">
      {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
      {loading ? 'Generation...' : 'Bon de livraison'}
    </button>
  );
}