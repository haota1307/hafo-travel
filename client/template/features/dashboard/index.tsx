'use client';

import { useI18n } from '@/template/i18n/provider';
import { Button } from '@/template/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/template/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/template/components/ui/tabs';
import { ConfigDrawer } from '@/template/components/config-drawer';
import { Header } from '@/template/components/layout/header';
import { Main } from '@/template/components/layout/main';
import { TopNav } from '@/template/components/layout/top-nav';
import { ProfileDropdown } from '@/template/components/profile-dropdown';
import { Search } from '@/template/components/search';
import { ThemeSwitch } from '@/template/components/theme-switch';

import { Analytics } from './components/analytics';
import { Overview } from './components/overview';
import { RecentSales } from './components/recent-sales';

export function Dashboard() {
  const { t, number, currency } = useI18n();

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} className="me-auto" />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('Dashboard')}</h1>
          <div className="flex items-center space-x-2">
            <Button>{t('Download')}</Button>
          </div>
        </div>
        <Tabs orientation="vertical" defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
              <TabsTrigger value="analytics">{t('Analytics')}</TabsTrigger>
              <TabsTrigger value="reports" disabled>
                {t('Reports')}{' '}
              </TabsTrigger>
              <TabsTrigger value="notifications" disabled>
                {t('Notifications')}{' '}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('Total Revenue')} </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currency(45231.89)}</div>
                  <p className="text-xs text-muted-foreground">{t('+20.1% from last month')} </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('Subscriptions')} </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{number(2350)}</div>
                  <p className="text-xs text-muted-foreground">{t('+180.1% from last month')} </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('Sales')}</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{number(12234)}</div>
                  <p className="text-xs text-muted-foreground">{t('+19% from last month')} </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('Active Now')} </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{number(573)}</div>
                  <p className="text-xs text-muted-foreground">{t('+201 since last hour')} </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>{t('Overview')}</CardTitle>
                </CardHeader>
                <CardContent className="ps-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>{t('Recent Sales')}</CardTitle>
                  <CardDescription>{t('You made 265 sales this month.')} </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}

const topNav = [
  {
    title: 'Overview',
    href: '/template',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: '/template/users',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: '/template/tasks',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: '/template/settings',
    isActive: false,
    disabled: true,
  },
];
