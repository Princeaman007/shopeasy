
'use client';

import { useEffect } from 'react';
import { getThemeConfig } from './theme.config';

export default function ThemeProvider({
  themeId,
  children,
}: {
  themeId:  string;
  children: React.ReactNode;
}) {
  const theme = getThemeConfig(themeId);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg',           theme.bg);
    root.style.setProperty('--theme-surface',      theme.surface);
    root.style.setProperty('--theme-elevated',     theme.elevated);
    root.style.setProperty('--theme-border',       theme.border);
    root.style.setProperty('--theme-text',         theme.text);
    root.style.setProperty('--theme-muted',        theme.muted);
    root.style.setProperty('--theme-accent',       theme.accent);
    root.style.setProperty('--theme-accent-hover', theme.accentHover);

    // Applique le fond de page
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color           = theme.text;

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color           = '';
    };
  }, [themeId]);

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color:           theme.text,
        minHeight:       '100vh',
      }}
    >
      {children}
    </div>
  );
}