'use client';

import { useI18n } from '@/template/i18n/provider';
import { useTableSearch } from '@/template/hooks/use-table-search';
import { ConfigDrawer } from '@/template/components/config-drawer';
import { Header } from '@/template/components/layout/header';
import { Main } from '@/template/components/layout/main';
import { ProfileDropdown } from '@/template/components/profile-dropdown';
import { Search } from '@/template/components/search';
import { ThemeSwitch } from '@/template/components/theme-switch';

import { UsersDialogs } from './components/users-dialogs';
import { UsersPrimaryButtons } from './components/users-primary-buttons';
import { UsersProvider } from './components/users-provider';
import { UsersTable } from './components/users-table';
import { users } from './data/users';

export function Users() {
  const { t } = useI18n();
  const { search, navigate } = useTableSearch();

  return (
    <UsersProvider>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('User List')}</h2>
            <p className="text-muted-foreground">{t('Manage your users and their roles here.')} </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={users} search={search} navigate={navigate} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  );
}
