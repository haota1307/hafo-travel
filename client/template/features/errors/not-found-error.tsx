'use client';

import { useI18n } from '@/template/i18n/provider';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/template/components/ui/button';

export function NotFoundError() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">404</h1>
        <span className="font-medium">{t('Oops! Page Not Found!')}</span>
        <p className="text-center text-muted-foreground">
          {t("It seems like the page you're looking for")} <br />
          {t('does not exist or might have been removed.')}{' '}
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            {t('Go Back')}{' '}
          </Button>
          <Button onClick={() => router.push('/template')}>{t('Back to Home')}</Button>
        </div>
      </div>
    </div>
  );
}
