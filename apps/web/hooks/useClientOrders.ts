'use client';

import { useState, useEffect } from 'react';

/**
 * Statuts possibles d'une commande
 */
export type StatutCommande = 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface ItemCommande {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    image?: string;
}

export interface Commande {
    _id: string;
    orderNumber: string;
    shopName?: string;
    items: ItemCommande[];
    subtotal: number;
    discount: number;
    total: number;
    promoCode?: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: string;
        city: string;
    };
    status: StatutCommande;
    statusHistory: { status: StatutCommande; date: string; note?: string }[];
    createdAt: string;
}

export function useClientOrders() {
    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);

    useEffect(() => {
        const fetchCommandes = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(
                    `/backend/orders/mes-commandes`,
                    {
                        credentials: 'include',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!res.ok) throw new Error('Erreur chargement');
                const data = await res.json();
                setCommandes(data.orders || []);
            } catch {
                setErreur('Impossible de charger vos commandes');
            } finally {
                setChargement(false);
            }
        };
        fetchCommandes();
    }, []);

    return { commandes, chargement, erreur };
}