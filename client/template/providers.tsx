'use client';

import { useEffect, useState } from 'react';

import { ThemeProvider, useTheme } from './context/theme-provider';
import { FontProvider, useFont } from './context/font-provider';
import { DirectionProvider, useDirection } from './context/direction-provider';
import { PortalContainerContext } from './context/portal-container-provider';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { useI18n } from './i18n/provider';

function TemplateRoot({ children }: { children: React.ReactNode }) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const { locale, t } = useI18n();
  useEffect(() => {
    document.title = t('Shadcn Admin Template');
  }, [t]);
  const { resolvedTheme } = useTheme();
  const { font } = useFont();
  const { dir } = useDirection();

  return (
    <PortalContainerContext value={portalContainer}>
      <div
        ref={setPortalContainer}
        id="template-root"
        lang={locale}
        dir={dir}
        className={`template-scope ${resolvedTheme} font-${font} min-h-svh w-full bg-background text-foreground`}
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </div>
    </PortalContainerContext>
  );
}

export function TemplateProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FontProvider>
        <DirectionProvider>
          <TemplateRoot>{children}</TemplateRoot>
        </DirectionProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
