
export interface ShopPublic {
  _id:            string;
  slug:           string;
  name:           string;
  logo?:          string;
  whatsapp:       string;
  planType:       'basic' | 'premium';
  selectedTheme:  string;
  isVerified:     boolean;
  about?: {
    description:  string;
    ownerName:    string;
    ownerPhoto:   string;
    location:     string;
    workingHours: string;
  };
}

export type ThemeId =
  | 'vitrine-moderne'
  | 'marche-colore'
  | 'luxe-sombre'
  | 'boutique-pro'
  | 'stories-style';

export interface ThemeConfig {
  bg:       string;
  surface:  string;
  elevated: string;
  border:   string;
  text:     string;
  muted:    string;
  accent:   string;
  accentHover: string;
}