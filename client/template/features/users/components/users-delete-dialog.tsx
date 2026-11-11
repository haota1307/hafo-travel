'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { useI18n } from '@/template/i18n/provider';
import { showSubmittedData } from '@/template/lib/show-submitted-data';
import { Alert, AlertDescription, AlertTitle } from '@/template/components/ui/alert';
import { Input } from '@/template/components/ui/input';
import { Label } from '@/template/components/ui/label';
import { ConfirmDialog } from '@/template/components/confirm-dialog';

import { type User } from '../data/schema';

type UserDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: User;
};

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UserDeleteDialogProps) {
  const { t } = useI18n();
  const [value, setValue] = useState('');

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) {
      return;
    }

    onOpenChange(false);
    showSubmittedData(currentRow, 'The following user has been deleted:');
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form="users-delete-form"
      disabled={value.trim() !== currentRow.username}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} />{' '}
          {t('Delete User')}{' '}
        </span>
      }
      desc={
        <form
          id="users-delete-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="space-y-4"
        >
          <p className="mb-2">
            {t('Are you sure you want to delete')}{' '}
            <span className="font-bold">{currentRow.username}</span>?
            <br />
            {t('This action will permanently remove the user with the role of')}{' '}
            <span className="font-bold">{t(currentRow.role)}</span>{' '}
            {t('from the system. This cannot be undone.')}{' '}
          </p>

          <Label className="my-2">
            {t('Username:')}{' '}
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('Enter username to confirm deletion.')}
              autoFocus
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>{t('Warning!')}</AlertTitle>
            <AlertDescription>
              {t('Please be careful, this operation can not be rolled back.')}{' '}
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText={t('Delete')}
      destructive
    />
  );
}
