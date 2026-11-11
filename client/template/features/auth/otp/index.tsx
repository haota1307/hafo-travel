'use client';

import { useI18n } from '@/template/i18n/provider';
import { Link } from '@/i18n/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/template/components/ui/card';

import { AuthLayout } from '../auth-layout';
import { OtpForm } from './components/otp-form';

export function Otp() {
  const { t } = useI18n();

  return (
    <AuthLayout>
      <Card className="max-w-md gap-4">
        <CardHeader>
          <CardTitle className="text-base tracking-tight">
            {t('Two-factor Authentication')}{' '}
          </CardTitle>
          <CardDescription>
            {t('Enter any six digits to preview verification.')} <br />
            {t('This template does not send authentication codes.')}{' '}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('Return to the')}{' '}
            <Link
              href="/template/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              {t('sign-in preview')}{' '}
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
