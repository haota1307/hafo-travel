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
import { UserAuthForm } from './components/user-auth-form';

export function SignIn() {
  const { t } = useI18n();

  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{t('Sign in')}</CardTitle>
          <CardDescription>
            {t('Enter your email and password below to log into')} <br className="max-sm:hidden" />{' '}
            {t("your account. Don't have an account?")}{' '}
            <Link
              href="/template/sign-up"
              className="text-nowrap underline underline-offset-4 hover:text-primary"
            >
              {t('Sign Up')}{' '}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t(
              'Template preview only. Form submissions do not create an account or start a session.',
            )}{' '}
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
