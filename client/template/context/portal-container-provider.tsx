'use client';

import { createContext, useContext } from 'react';

// Each mounted template owns its portal target, including during locale transitions.
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}
