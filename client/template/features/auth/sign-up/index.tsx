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
import { SignUpForm } from './components/sign-up-form';

export function SignUp() {
  const { t } = useI18n();

  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{t('Create an account')} </CardTitle>
          <CardDescription>
            {t('Enter your email and password to create an account.')} <br />
            {t('Already have an account?')}{' '}
            <Link
              href="/template/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              {t('Sign In')}{' '}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
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
