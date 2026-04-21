
import { ThemeId, ThemeConfig } from './types';

export const THEME_CONFIGS: Record<ThemeId, ThemeConfig> = {
  'vitrine-moderne': {
    bg:          '#0f172a',
    surface:     '#1e293b',
    elevated:    '#334155',
    border:      '#475569',
    text:        '#f8fafc',
    muted:       '#94a3b8',
    accent:      '#10b981',
    accentHover: '#059669',
  },
  'marche-colore': {
    bg:          '#1c1917',
    surface:     '#292524',
    elevated:    '#44403c',
    border:      '#57534e',
    text:        '#fafaf9',
    muted:       '#a8a29e',
    accent:      '#f59e0b',
    accentHover: '#d97706',
  },
  'luxe-sombre': {
    bg:          '#0c0a09',
    surface:     '#1c1917',
    elevated:    '#292524',
    border:      '#44403c',
    text:        '#fafaf9',
    muted:       '#a8a29e',
    accent:      '#d97706',
    accentHover: '#b45309',
  },
  'boutique-pro': {
    bg:          '#f0f9ff',
    surface:     '#ffffff',
    elevated:    '#e0f2fe',
    border:      '#bae6fd',
    text:        '#0f172a',
    muted:       '#64748b',
    accent:      '#0ea5e9',
    accentHover: '#0284c7',
  },
  'stories-style': {
    bg:          '#18181b',
    surface:     '#27272a',
    elevated:    '#3f3f46',
    border:      '#52525b',
    text:        '#fafafa',
    muted:       '#a1a1aa',
    accent:      '#8b5cf6',
    accentHover: '#7c3aed',
  },
};

export const getThemeConfig = (themeId: string): ThemeConfig =>
  THEME_CONFIGS[themeId as ThemeId] ?? THEME_CONFIGS['vitrine-moderne'];