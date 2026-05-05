'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id:       string;
  name:     string;
  email:    string;
  role:     'merchant' | 'client' | 'admin';
  isOwner?: boolean;
}

interface Shop {
  id:                 string;
  slug:               string;
  name:               string;
  planType:           'basic' | 'premium';
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
  trialEndsAt:        string;
  selectedTheme:      string;
  isVerified:         boolean;
}

interface AuthContextType {
  user:            User | null;
  shop:            Shop | null;
  token:           string | null;
  isLoading:       boolean;
  isConnecte:      boolean;
  estProprietaire: boolean;
  login:           (token: string, user: User, shop?: Shop) => void;
  logout:          () => Promise<void>;
  refreshShop:     () => Promise<void>;
  fetchAvecAuth:   (url: string, options?: RequestInit) => Promise<Response>;
}

// ─── Helpers token ────────────────────────────────────────────────────────────

/**
 * Decode le payload JWT sans vérification de signature
 */
const decodeToken = (token: string): { exp?: number; userId?: string; role?: string } | null => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
};

/**
 * Vérifie si le token est expiré (avec marge de 60 secondes)
 */
const tokenExpire = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now() + 60_000;
};

// ─── Contexte ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [shop,      setShop]      = useState<Shop | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref pour éviter les refreshs simultanés
  const refreshEnCours = useRef(false);
  const tokenRef       = useRef<string | null>(null);

  // Synchronise la ref avec le state
  useEffect(() => { tokenRef.current = token; }, [token]);

  // ── Déconnexion ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method:      'POST',
        credentials: 'include',
      });
    } catch {}

    setToken(null);
    setUser(null);
    setShop(null);
    tokenRef.current = null;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop');

    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    window.location.href = '/connexion';
  }, []);

  // ── Refresh token ──────────────────────────────────────────────────────────
  const rafraichirToken = useCallback(async (): Promise<string | null> => {
    if (refreshEnCours.current) return tokenRef.current;
    refreshEnCours.current = true;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        await logout();
        return null;
      }

      const data     = await res.json();
      const newToken = data.token;

      if (!newToken) {
        await logout();
        return null;
      }

      // ✅ Met à jour le token partout
      setToken(newToken);
      tokenRef.current = newToken;
      localStorage.setItem('token', newToken);
      document.cookie = `token=${newToken}; path=/; max-age=604800`;

      return newToken;
    } catch {
      await logout();
      return null;
    } finally {
      refreshEnCours.current = false;
    }
  }, [logout]);

  // ── fetchAvecAuth — fetch avec gestion auto du token ──────────────────────
  const fetchAvecAuth = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    let tokenActuel = tokenRef.current;

    // ✅ Si le token est expiré → refresh avant d'envoyer la requête
    if (tokenActuel && tokenExpire(tokenActuel)) {
      tokenActuel = await rafraichirToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };

    if (tokenActuel) {
      headers['Authorization'] = `Bearer ${tokenActuel}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // ✅ Si 401 → essaie de refresh et relance UNE fois
    if (response.status === 401 && tokenActuel) {
      const nouveauToken = await rafraichirToken();
      if (!nouveauToken) return response;

      headers['Authorization'] = `Bearer ${nouveauToken}`;
      return fetch(url, { ...options, headers, credentials: 'include' });
    }

    return response;
  }, [rafraichirToken]);

  // ── Chargement initial depuis localStorage ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser  = localStorage.getItem('user');
        const storedShop  = localStorage.getItem('shop');

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        // ✅ Vérifie si le token est expiré
        if (tokenExpire(storedToken)) {
          // Essaie de refresh via le cookie refreshToken
          const newToken = await rafraichirToken();
          if (!newToken) {
            setIsLoading(false);
            return;
          }
        } else {
          setToken(storedToken);
          tokenRef.current = storedToken;
        }

        setUser(JSON.parse(storedUser));
        if (storedShop) setShop(JSON.parse(storedShop));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('shop');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [rafraichirToken]);

  // ── Refresh automatique toutes les 40 minutes ──────────────────────────────
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      if (tokenRef.current && tokenExpire(tokenRef.current)) {
        await rafraichirToken();
      }
    }, 40 * 60 * 1000); // toutes les 40 minutes

    return () => clearInterval(interval);
  }, [token, rafraichirToken]);

  // ── Connexion ──────────────────────────────────────────────────────────────
  const login = useCallback((newToken: string, newUser: User, newShop?: Shop) => {
    setToken(newToken);
    tokenRef.current = newToken;
    setUser(newUser);
    if (newShop) setShop(newShop);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user',  JSON.stringify(newUser));
    if (newShop) localStorage.setItem('shop', JSON.stringify(newShop));
  }, []);

  // ── Rafraîchit les infos boutique ─────────────────────────────────────────
  const refreshShop = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const response = await fetchAvecAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/shops/me`
      );
      if (!response.ok) return;

      const result   = await response.json();
      const shopData = result.data;

      const shopMapped: Shop = {
        id:                 shopData._id,
        slug:               shopData.slug,
        name:               shopData.name,
        planType:           shopData.planType,
        subscriptionStatus: shopData.subscriptionStatus,
        trialEndsAt:        shopData.trialEndsAt,
        selectedTheme:      shopData.selectedTheme,
        isVerified:         shopData.isVerified,
      };

      setShop(shopMapped);
      localStorage.setItem('shop', JSON.stringify(shopMapped));
    } catch {
      console.error('Erreur refreshShop');
    }
  }, [fetchAvecAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        token,
        isLoading,
        isConnecte:      !!user,
        estProprietaire: user?.isOwner ?? false,
        login,
        logout,
        refreshShop,
        fetchAvecAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}