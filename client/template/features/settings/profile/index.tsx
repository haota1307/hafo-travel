'use client';

import { useI18n } from '@/template/i18n/provider';

import { ContentSection } from '../components/content-section';
import { ProfileForm } from './profile-form';

export function SettingsProfile() {
  const { t } = useI18n();

  return (
    <ContentSection title={t('Profile')} desc={t('This is how others will see you on the site.')}>
      <ProfileForm />
    </ContentSection>
  );
}
