'use client';

import { useI18n } from '@/template/i18n/provider';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/template/components/ui/alert-dialog';
import { Button } from '@/template/components/ui/button';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  disabled?: boolean;
  desc: React.JSX.Element | string;
  cancelBtnText?: string;
  confirmText?: React.ReactNode;
  destructive?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
} & ({ form: string; handleConfirm?: undefined } | { form?: undefined; handleConfirm: () => void });

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { t } = useI18n();
  const {
    title,
    desc,
    children,
    className,
    confirmText,
    cancelBtnText,
    destructive,
    isLoading,
    disabled = false,
    form,
    handleConfirm,
    ...actions
  } = props;

  return (
    <AlertDialog {...actions}>
      <AlertDialogContent className={cn(className && className)}>
        <AlertDialogHeader className="text-start">
          <AlertDialogTitle>{typeof title === 'string' ? t(title) : title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{typeof desc === 'string' ? t(desc) : desc}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t(cancelBtnText ?? 'Cancel')}</AlertDialogCancel>
          <Button
            type={form ? 'submit' : 'button'}
            form={form}
            onClick={handleConfirm}
            variant={destructive ? 'destructive' : 'default'}
            disabled={disabled || isLoading}
          >
            {typeof confirmText === 'string' ? t(confirmText) : (confirmText ?? t('Continue'))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
