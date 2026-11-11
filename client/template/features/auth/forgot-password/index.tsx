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
import { ForgotPasswordForm } from './components/forgot-password-form';

export function ForgotPassword() {
  const { t } = useI18n();

  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4 sm:min-w-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{t('Forgot Password')} </CardTitle>
          <CardDescription>
            {t('Enter your email to preview password reset. No email will be sent.')}{' '}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className="mx-auto px-8 text-center text-sm text-balance text-muted-foreground">
            {t("Don't have an account?")}{' '}
            <Link
              href="/template/sign-up"
              className="underline underline-offset-4 hover:text-primary"
            >
              {t('Sign up')}{' '}
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
