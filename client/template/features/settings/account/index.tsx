'use client';

import { useI18n } from '@/template/i18n/provider';

import { ContentSection } from '../components/content-section';
import { AccountForm } from './account-form';

export function SettingsAccount() {
  const { t } = useI18n();

  return (
    <ContentSection
      title={t('Account')}
      desc={t('Update your account settings. Set your preferred language and timezone.')}
    >
      <AccountForm />
    </ContentSection>
  );
}
