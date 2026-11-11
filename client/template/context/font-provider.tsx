'use client';

import { createContext, useContext } from 'react';

import { fonts } from '../config/fonts';
import { useTemplateCookie } from '../hooks/use-template-cookie';

type Font = (typeof fonts)[number];

const FontContext = createContext<{
  font: Font;
  setFont: (font: Font) => void;
  resetFont: () => void;
} | null>(null);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [savedFont, setFont, resetFont] = useTemplateCookie<Font>('template-font', fonts[0]);
  const font = fonts.includes(savedFont) ? savedFont : fonts[0];

  return <FontContext value={{ font, setFont, resetFont }}>{children}</FontContext>;
}

export function useFont() {
  const context = useContext(FontContext);

  if (!context) {
    throw new Error('useFont must be used within FontProvider');
  }

  return context;
}
