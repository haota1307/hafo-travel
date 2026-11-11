'use client';

import { useTemplateCookie } from '@/template/hooks/use-template-cookie';
import { cn } from '@/lib/utils';
import { LayoutProvider } from '@/template/context/layout-provider';
import { SearchProvider } from '@/template/context/search-provider';
import { SidebarInset, SidebarProvider } from '@/template/components/ui/sidebar';
import { AppSidebar } from '@/template/components/layout/app-sidebar';
import { SkipToMain } from '@/template/components/skip-to-main';

type AuthenticatedLayoutProps = {
  children?: React.ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarState, setSidebarState] = useTemplateCookie<'true' | 'false'>(
    'template-sidebar',
    'true',
  );
  const defaultOpen = sidebarState !== 'false';

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider
          open={defaultOpen}
          onOpenChange={(open) => setSidebarState(open ? 'true' : 'false')}
        >
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]',
            )}
          >
            {children}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  );
}
