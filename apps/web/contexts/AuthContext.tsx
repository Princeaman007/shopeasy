'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id:    string;
  name:  string;
  email: string;
  role:  'merchant' | 'client' | 'admin';
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
  user:        User | null;
  shop:        Shop | null;
  token:       string | null;
  isLoading:   boolean;
  isConnecte:  boolean;
  login:       (token: string, user: User, shop?: Shop) => void;
  logout:      () => Promise<void>;
  refreshShop: () => Promise<void>;
}

// ─── Contexte ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [shop,      setShop]      = useState<Shop | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -- Chargement depuis localStorage au démarrage --
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser  = localStorage.getItem('user');
      const storedShop  = localStorage.getItem('shop');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedShop) setShop(JSON.parse(storedShop));
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('shop');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -- Connexion --
  const login = useCallback((
    newToken: string,
    newUser:  User,
    newShop?: Shop
  ) => {
    setToken(newToken);
    setUser(newUser);
    if (newShop) setShop(newShop);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user',  JSON.stringify(newUser));
    if (newShop) localStorage.setItem('shop', JSON.stringify(newShop));
  }, []);

  // -- Déconnexion --
  const logout = useCallback(async () => {
    try {
      await fetch(`/backend/auth/logout`, {
        method:      'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore les erreurs réseau
    }

    setToken(null);
    setUser(null);
    setShop(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop');

    // Supprime le cookie côté client aussi (au cas où)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    window.location.href = '/connexion';
  }, []);

  // -- Rafraîchit les infos boutique --
  const refreshShop = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(
        `/backend/shops/me`,
        {
          headers:     { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
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
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        token,
        isLoading,
        isConnecte: !!user,
        login,
        logout,
        refreshShop,
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