'use client';

import { useI18n } from '@/template/i18n/provider';

import { ContentSection } from '../components/content-section';
import { DisplayForm } from './display-form';

export function SettingsDisplay() {
  const { t } = useI18n();

  return (
    <ContentSection
      title={t('Display')}
      desc={t("Turn items on or off to control what's displayed in the app.")}
    >
      <DisplayForm />
    </ContentSection>
  );
}
