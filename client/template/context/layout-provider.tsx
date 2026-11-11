'use client';

import { createContext, useContext } from 'react';

import { useTemplateCookie } from '../hooks/use-template-cookie';

export type Collapsible = 'offcanvas' | 'icon' | 'none';

type Variant = 'inset' | 'sidebar' | 'floating';

// Cookie constants following the pattern from sidebar.tsx
const LAYOUT_COLLAPSIBLE_COOKIE_NAME = 'template-layout-collapsible';

const LAYOUT_VARIANT_COOKIE_NAME = 'template-layout-variant';

// Default values
const DEFAULT_VARIANT = 'inset';

const DEFAULT_COLLAPSIBLE = 'icon';

type LayoutContextType = {
  resetLayout: () => void;

  defaultCollapsible: Collapsible;
  collapsible: Collapsible;
  setCollapsible: (collapsible: Collapsible) => void;

  defaultVariant: Variant;
  variant: Variant;
  setVariant: (variant: Variant) => void;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

type LayoutProviderProps = {
  children: React.ReactNode;
};

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [savedCollapsible, setCollapsible] = useTemplateCookie<Collapsible>(
    LAYOUT_COLLAPSIBLE_COOKIE_NAME,
    DEFAULT_COLLAPSIBLE,
  );
  const [savedVariant, setVariant] = useTemplateCookie<Variant>(
    LAYOUT_VARIANT_COOKIE_NAME,
    DEFAULT_VARIANT,
  );
  const collapsible = ['offcanvas', 'icon', 'none'].includes(savedCollapsible)
    ? savedCollapsible
    : DEFAULT_COLLAPSIBLE;
  const variant = ['inset', 'sidebar', 'floating'].includes(savedVariant)
    ? savedVariant
    : DEFAULT_VARIANT;

  const resetLayout = () => {
    setCollapsible(DEFAULT_COLLAPSIBLE);
    setVariant(DEFAULT_VARIANT);
  };

  const contextValue: LayoutContextType = {
    resetLayout,
    defaultCollapsible: DEFAULT_COLLAPSIBLE,
    collapsible,
    setCollapsible,
    defaultVariant: DEFAULT_VARIANT,
    variant,
    setVariant,
  };

  return <LayoutContext value={contextValue}>{children}</LayoutContext>;
}

// Define the hook for the provider
export function useLayout() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }

  return context;
}
