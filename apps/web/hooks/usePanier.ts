'use client';

import { useState, useEffect } from 'react';

/**
 * Retourne le nombre total d'articles dans le panier
 * Lu depuis localStorage — se met à jour en temps réel
 */
export function usePanierCount(shopSlug: string) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const calculerCount = () => {
            try {
                const data = localStorage.getItem(`panier_${shopSlug}`);
                if (!data) { setCount(0); return; }
                const items = JSON.parse(data);
                const total = items.reduce(
                    (acc: number, item: { quantite: number }) => acc + item.quantite, 0
                );
                setCount(total);
            } catch {
                setCount(0);
            }
        };

        // Calcul initial
        calculerCount();

        // Écoute les changements localStorage (entre onglets ou composants)
        window.addEventListener('storage', calculerCount);
        window.addEventListener('panier-updated', calculerCount);

        return () => {
            window.removeEventListener('storage', calculerCount);
            window.removeEventListener('panier-updated', calculerCount);
        };
    }, [shopSlug]);

    return count;
}