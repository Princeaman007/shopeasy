export const getApiUrl = (): string => {
  if (typeof window === 'undefined') {
    // Côté serveur — appel direct au backend
    return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  }
  // Côté client — passe par le proxy Vercel
  return '/backend';
};

export const API_URL = getApiUrl();