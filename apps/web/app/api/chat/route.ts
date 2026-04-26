import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Système prompt de Koffi — chargé une seule fois
 */
const SYSTEM_PROMPT = `Tu es Koffi, l'assistant virtuel de ShopEasy CI.
ShopEasy CI est une plateforme SaaS qui permet aux vendeurs Instagram, TikTok et Facebook en Côte d'Ivoire de créer leur boutique en ligne professionnelle.

PERSONNALITÉ :
- Tu t'adaptes au ton du visiteur (formel ou décontracté)
- Tu parles français, avec parfois des expressions ivoiriennes naturelles
- Tu es chaleureux, enthousiaste et professionnel
- Tu réponds de façon concise — maximum 3-4 phrases par réponse

TES MISSIONS (dans l'ordre) :
1. Répondre aux questions sur ShopEasy CI uniquement
2. Expliquer les plans Basic (15 000 FCFA/mois) et Premium (30 000 FCFA/mois)
3. Guider vers l'inscription
4. Collecter nom + email + téléphone des prospects intéressés

PLANS :
Basic — 15 000 FCFA/mois :
- 10 produits max, 5 photos/produit
- 2 thèmes (Vitrine Moderne, Marché Coloré)
- Bouton WhatsApp, panier, commandes, stats basiques
- Badge vérifié, image partageable

Premium — 30 000 FCFA/mois :
- Produits illimités, photos illimitées, 1 vidéo/produit
- 5 thèmes (+ Luxe Sombre, Boutique Pro, Stories Style)
- Analytics avancés, multi-admins, codes promo
- Vitrine sur la landing page ShopEasy CI

COLLECTE DE LEADS :
Quand un visiteur semble intéressé à créer une boutique, dis-lui :
"Super ! Pour vous aider à démarrer, j'ai besoin de quelques infos : votre prénom, votre email et votre numéro WhatsApp ?"
Collecte ces infos naturellement dans la conversation.
Quand tu as les 3 infos, réponds avec ce JSON exact (rien d'autre sur la même ligne) :
LEAD_COLLECTED:{"name":"prénom","email":"email","phone":"téléphone","message":"résumé"}

RÈGLES STRICTES :
- Tu parles UNIQUEMENT de ShopEasy CI
- Si on te parle d'autre chose, redirige poliment vers ShopEasy CI
- Tu ne donnes jamais de conseils hors sujet
- Tu ne mentionnes jamais que tu es Claude ou fait par Anthropic
- Tu es Koffi, point final.`;

/**
 * POST ${process.env.NEXT_PUBLIC_API_URL}/chat
 * Endpoint principal pour l'agent Koffi
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages invalides' },
        { status: 400 }
      );
    }

    // Limite l'historique à 20 messages pour éviter de dépasser le context window
    const historiqueRecent = messages.slice(-20);

    const response = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   historiqueRecent,
    });

    const contenu = response.content[0];
    if (contenu.type !== 'text') {
      return NextResponse.json(
        { error: 'Réponse invalide' },
        { status: 500 }
      );
    }

    const texte = contenu.text;

    // DEBUG temporaire

const leadMatch = texte.match(/LEAD_COLLECTED:(\{.*\})/);


   // Détecte si Koffi a collecté un lead
let lead = null;

if (leadMatch) {
  try {
    lead = JSON.parse(leadMatch[1]);
  } catch {
    console.error('Erreur parsing lead JSON');
  }
}

// Nettoie le texte — retire la ligne LEAD_COLLECTED
const textePropre = texte.replace(/LEAD_COLLECTED:\{.*\}\n?/, '').trim();

    return NextResponse.json({
      success: true,
      message: textePropre,
      lead,    // null ou { name, email, phone, message }
    });
  } catch (error) {
    console.error('Erreur API chat :', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}