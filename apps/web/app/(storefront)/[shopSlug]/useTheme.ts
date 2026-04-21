
'use client';

import { getThemeConfig } from './theme.config';
import type { ThemeConfig } from './types';

export function useTheme(themeId: string): ThemeConfig {
  return getThemeConfig(themeId);
}