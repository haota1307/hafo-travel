'use client';

import { Monitor, Bell, Palette, Wrench, UserCog } from 'lucide-react';

import { useI18n } from '@/template/i18n/provider';
import { Separator } from '@/template/components/ui/separator';
import { ConfigDrawer } from '@/template/components/config-drawer';
import { Header } from '@/template/components/layout/header';
import { Main } from '@/template/components/layout/main';
import { ProfileDropdown } from '@/template/components/profile-dropdown';
import { Search } from '@/template/components/search';
import { ThemeSwitch } from '@/template/components/theme-switch';

import { SidebarNav } from './components/sidebar-nav';

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/template/settings',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Account',
    href: '/template/settings/account',
    icon: <Wrench size={18} />,
  },
  {
    title: 'Appearance',
    href: '/template/settings/appearance',
    icon: <Palette size={18} />,
  },
  {
    title: 'Notifications',
    href: '/template/settings/notifications',
    icon: <Bell size={18} />,
  },
  {
    title: 'Display',
    href: '/template/settings/display',
    icon: <Monitor size={18} />,
  },
];

export function Settings({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('Settings')} </h1>
          <p className="text-muted-foreground">
            {t('Manage your account settings and set e-mail preferences.')}{' '}
          </p>
        </div>
        <Separator className="my-4 lg:my-6" />
        <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="top-0 lg:sticky lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex w-full overflow-y-hidden p-1">{children}</div>
        </div>
      </Main>
    </>
  );
}
