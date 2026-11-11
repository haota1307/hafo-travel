'use client';

import { useI18n } from '@/template/i18n/provider';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/template/components/ui/button';

export function ForbiddenError() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">403</h1>
        <span className="font-medium">{t('Access Forbidden')}</span>
        <p className="text-center text-muted-foreground">
          {t("You don't have necessary permission")} <br />
          {t('to view this resource.')}{' '}
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
