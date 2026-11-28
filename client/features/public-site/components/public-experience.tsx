"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { mountReveals } from "./public-reveal";
import { mountSectionNavigation } from "./public-section-navigation";

const PublicPortalContext = createContext<HTMLElement | null>(null);

export function usePublicPortalContainer() {
  return useContext(PublicPortalContext);
}

export function PublicExperience({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (!root) {
      return;
    }

    const element = root;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cleanup = [
      mountReveals(element, reducedMotion),
      mountSectionNavigation(element, reducedMotion),
    ];

    return () => {
      for (const dispose of cleanup) {
        dispose();
      }
    };
  }, [root, pathname, locale]);

  return (
    <PublicPortalContext.Provider value={root}>
      <div ref={setRoot} className="public-site" data-public-page={pathname}>
        {children}
      </div>
    </PublicPortalContext.Provider>
  );
}
