'use client';

import { useI18n } from '@/template/i18n/provider';

import { ContentSection } from '../components/content-section';
import { NotificationsForm } from './notifications-form';

export function SettingsNotifications() {
  const { t } = useI18n();

  return (
    <ContentSection title={t('Notifications')} desc={t('Configure how you receive notifications.')}>
      <NotificationsForm />
    </ContentSection>
  );
}
