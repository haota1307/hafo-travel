'use client';

import { Menu, X } from 'lucide-react';

import { useI18n } from '@/template/i18n/provider';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/template/components/ui/sidebar';

import { Button } from '../ui/button';

export function AppTitle() {
  const { t } = useI18n();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="gap-0 py-0 hover:bg-transparent active:bg-transparent"
          asChild
        >
          <div>
            <Link
              href="/template"
              onClick={() => setOpenMobile(false)}
              className="grid flex-1 text-start text-sm leading-tight"
            >
              <span className="truncate font-bold">Shadcn-Admin</span>
              <span className="truncate text-xs">{t('Next.js + ShadcnUI')}</span>
            </Link>
            <ToggleSidebar />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function ToggleSidebar({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { t } = useI18n();
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('aspect-square size-8 max-md:scale-125', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <X className="md:hidden" />
      <Menu className="max-md:hidden" />
      <span className="sr-only">{t('Toggle Sidebar')}</span>
    </Button>
  );
}
