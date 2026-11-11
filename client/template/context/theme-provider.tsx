'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';

import { useTemplateCookie } from '../hooks/use-template-cookie';

type Theme = 'dark' | 'light' | 'system';

type ThemeState = {
  defaultTheme: Theme;
  resolvedTheme: 'dark' | 'light';
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);

  return () => media.removeEventListener('change', onChange);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [savedTheme, setTheme, resetTheme] = useTemplateCookie<Theme>('template-theme', 'system');
  const theme = ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  );
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  return (
    <ThemeContext
      value={{
        defaultTheme: 'system',
        theme,
        resolvedTheme,
        setTheme,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
