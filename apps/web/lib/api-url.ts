/**
 * Retourne l'URL de base de l'API selon le contexte
 * - Serveur : utilise API_URL (variable privée)
 * - Client  : utilise NEXT_PUBLIC_API_URL (variable publique)
 */
export const getApiUrl = (): string => {
  if (typeof window === 'undefined') {
    // Côté serveur
    return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  }
  // Côté client
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
};

export const API_URL = getApiUrl();