'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const FAQ = [
  {
    question: "Comment fonctionne l'essai gratuit ?",
    reponse:  "Vous avez 7 jours pour tester ShopEasy CI gratuitement, sans carte bancaire. Pendant cette période, vous pouvez créer votre boutique, ajouter vos produits et recevoir des commandes. À la fin de l'essai, choisissez un plan pour continuer.",
  },
  {
    question: "Comment mes clients me paient-ils ?",
    reponse:  "ShopEasy CI fonctionne 100% à la livraison. Vos clients passent commande en ligne, et vous encaissez directement l'argent à la livraison. Pas d'intermédiaire, pas de frais de transaction.",
  },
  {
    question: "Comment payer mon abonnement ShopEasy CI ?",
    reponse:  "Vous payez votre abonnement mensuel par Orange Money, Wave, MTN Money ou virement bancaire. Notre équipe confirme manuellement votre paiement sous 24h.",
  },
  {
    question: "Puis-je utiliser mon propre nom de domaine ?",
    reponse:  "En V1, votre boutique est accessible via nomdevotreboutique.shopeasyci.ci. La possibilité d'utiliser votre propre domaine sera disponible dans une prochaine version.",
  },
  {
    question: "Combien de produits puis-je ajouter ?",
    reponse:  "Avec le plan Basic, vous pouvez ajouter jusqu'à 10 produits avec 5 photos chacun. Le plan Premium vous donne des produits illimités avec photos et vidéos illimitées.",
  },
  {
    question: "Mes clients peuvent-ils commander sans compte ?",
    reponse:  "Oui ! Vos clients peuvent passer commande en tant qu'invités, sans créer de compte. Ils renseignent juste leur nom, téléphone et adresse de livraison.",
  },
  {
    question: "Comment recevoir les notifications de commandes ?",
    reponse:  "Vous recevez une notification par email et sur votre dashboard dès qu'une nouvelle commande arrive. Vous pouvez aussi activer les notifications WhatsApp.",
  },
  {
    question: "Puis-je avoir plusieurs admins pour ma boutique ?",
    reponse:  "La fonctionnalité multi-admins est disponible sur le plan Premium. Vous pouvez inviter des collaborateurs pour gérer votre boutique avec vous.",
  },
  {
    question: "Que se passe-t-il si je ne renouvelle pas mon abonnement ?",
    reponse:  "Vous recevez un rappel 3 jours avant l'expiration. Si vous ne renouvelez pas, votre boutique est suspendue. Vos données sont conservées et vous pouvez la réactiver à tout moment.",
  },
  {
    question: "ShopEasy CI est-il disponible en dehors de la Côte d'Ivoire ?",
    reponse:  "ShopEasy CI est actuellement optimisé pour la Côte d'Ivoire. Une expansion vers d'autres pays d'Afrique de l'Ouest est prévue prochainement.",
  },
];

function FaqItem({
  question,
  reponse,
  ouvert,
  onClick,
}: {
  question: string;
  reponse:  string;
  ouvert:   boolean;
  onClick:  () => void;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-elevated transition-colors"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <ChevronDown
          size={20}
          className={`text-muted flex-shrink-0 transition-transform duration-300 ${
            ouvert ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${ouvert ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-4 border-t border-border">
          <p className="text-muted leading-relaxed pt-4">{reponse}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [ouvert, setOuvert] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOuvert(ouvert === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <span className="text-primary text-sm font-medium">Questions fréquentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Tout ce que vous voulez savoir
          </h2>
          <p className="text-muted text-lg">
            Vous ne trouvez pas votre réponse ? Parlez à Koffi ou contactez-nous.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              reponse={item.reponse}
              ouvert={ouvert === index}
              onClick={() => toggle(index)}
            />
          ))}
        </div>

        <div className="mt-12 text-center bg-surface border border-border rounded-2xl p-8 space-y-4">
          <h3 className="text-white font-bold text-xl">Vous avez d'autres questions ?</h3>
          <p className="text-muted">
            Notre assistant Koffi est disponible 24h/24 pour vous répondre.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://wa.me/2250000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
               WhatsApp
            </Link>
            <Link
              href="mailto:info@shopeasyci.ci"
              className="inline-flex items-center justify-center gap-2 bg-elevated hover:bg-border border border-border text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
               Email
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}