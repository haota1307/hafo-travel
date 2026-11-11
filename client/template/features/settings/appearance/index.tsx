'use client';

import { useI18n } from '@/template/i18n/provider';

import { ContentSection } from '../components/content-section';
import { AppearanceForm } from './appearance-form';

export function SettingsAppearance() {
  const { t } = useI18n();

  return (
    <ContentSection
      title={t('Appearance')}
      desc={t(
        'Customize the appearance of the app. Automatically switch between day and night themes.',
      )}
    >
      <AppearanceForm />
    </ContentSection>
  );
}
