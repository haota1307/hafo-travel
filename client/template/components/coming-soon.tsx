'use client';

import { Telescope } from 'lucide-react';

import { useI18n } from '@/template/i18n/provider';

export function ComingSoon() {
  const { t } = useI18n();

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <Telescope size={72} />
        <h1 className="text-4xl leading-tight font-bold">{t('Coming Soon!')}</h1>
        <p className="text-center text-muted-foreground">
          {t('This page has not been created yet.')} <br />
          {t('Stay tuned though!')}{' '}
        </p>
      </div>
    </div>
  );
}
