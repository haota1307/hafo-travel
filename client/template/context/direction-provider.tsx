'use client';

import { createContext, useContext } from 'react';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';

import { useTemplateCookie } from '../hooks/use-template-cookie';

export type Direction = 'ltr' | 'rtl';

const DirectionContext = createContext<{
  defaultDir: Direction;
  dir: Direction;
  setDir: (dir: Direction) => void;
  resetDir: () => void;
} | null>(null);

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const [savedDir, setDir, resetDir] = useTemplateCookie<Direction>('template-dir', 'ltr');
  const dir = savedDir === 'rtl' ? 'rtl' : 'ltr';

  return (
    <DirectionContext value={{ defaultDir: 'ltr', dir, setDir, resetDir }}>
      <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>
    </DirectionContext>
  );
}

export function useDirection() {
  const context = useContext(DirectionContext);

  if (!context) {
    throw new Error('useDirection must be used within DirectionProvider');
  }

  return context;
}
