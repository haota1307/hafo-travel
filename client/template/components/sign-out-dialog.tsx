'use client';

import { useI18n } from '@/template/i18n/provider';
import { useRouter } from '@/i18n/navigation';

import { ConfirmDialog } from './confirm-dialog';

export function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Sign out')}
      desc={t('Preview the sign-in screen. This template does not create a session.')}
      confirmText={t('Continue')}
      handleConfirm={() => {
        onOpenChange(false);
        router.push('/template/sign-in');
      }}
      className="sm:max-w-sm"
    />
  );
}
