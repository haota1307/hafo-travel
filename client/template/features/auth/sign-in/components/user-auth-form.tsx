'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/template/i18n/provider';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { sleep } from '@/template/lib/utils';
import { Button } from '@/template/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/template/components/ui/form';
import { Input } from '@/template/components/ui/input';
import { PasswordInput } from '@/template/components/password-input';

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email.' : 'Please enter a valid email.'),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .min(7, 'Password must be at least 7 characters long.'),
});

type UserAuthFormProps = React.HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    toast.promise(sleep(2000), {
      loading: t('Signing in...'),
      success: () => {
        setIsLoading(false);

        router.push('/template');

        return t('Demo sign-in for {email}. No session was created.', {
          email: data.email,
        });
      },
      error: t('Error'),
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('name@example.com')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder={t('********')} {...field} />
              </FormControl>
              <FormMessage />
              <Link
                href="/template/forgot-password"
                className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
              >
                {t('Forgot password?')}{' '}
              </Link>
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
          {t('Sign in')}{' '}
        </Button>
      </form>
    </Form>
  );
}
