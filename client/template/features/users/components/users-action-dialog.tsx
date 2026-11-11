'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useI18n } from '@/template/i18n/provider';
import { showSubmittedData } from '@/template/lib/show-submitted-data';
import { Button } from '@/template/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/template/components/ui/dialog';
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
import { SelectDropdown } from '@/template/components/select-dropdown';

import { roles } from '../data/data';
import { type User } from '../data/schema';

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    username: z.string().min(1, 'Username is required.'),
    phoneNumber: z.string().min(1, 'Phone number is required.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Email is required.' : 'Please enter a valid email.'),
    }),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, 'Role is required.'),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) {
        return true;
      }

      return data.password.length > 0;
    },
    {
      message: 'Password is required.',
      path: ['password'],
    },
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) {
        return true;
      }

      return password.length >= 8;
    },
    {
      message: 'Password must be at least 8 characters long.',
      path: ['password'],
    },
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) {
        return true;
      }

      return /[a-z]/.test(password);
    },
    {
      message: 'Password must contain at least one lowercase letter.',
      path: ['password'],
    },
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) {
        return true;
      }

      return /\d/.test(password);
    },
    {
      message: 'Password must contain at least one number.',
      path: ['password'],
    },
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) {
        return true;
      }

      return password === confirmPassword;
    },
    {
      message: "Passwords don't match.",
      path: ['confirmPassword'],
    },
  );

type UserForm = z.infer<typeof formSchema>;

type UserActionDialogProps = {
  currentRow?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsersActionDialog({ currentRow, open, onOpenChange }: UserActionDialogProps) {
  const { t } = useI18n();
  const isEdit = !!currentRow;
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          role: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  });

  const onSubmit = (values: UserForm) => {
    form.reset();
    showSubmittedData(values);
    onOpenChange(false);
  };

  const isPasswordTouched = !!form.formState.dirtyFields.password;

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>{t(isEdit ? 'Edit User' : 'Add New User')}</DialogTitle>
          <DialogDescription>
            {t(isEdit ? 'Update the user here. ' : 'Create new user here. ')}
            {t("Click save when you're done.")}{' '}
          </DialogDescription>
        </DialogHeader>
        <div className="h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <Form {...form}>
            <form
              id="user-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-0.5"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('First Name')} </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('John')}
                        className="col-span-4"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Last Name')} </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('Doe')}
                        className="col-span-4"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Username')} </FormLabel>
                    <FormControl>
                      <Input placeholder={t('john_doe')} className="col-span-4" {...field} />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('john.doe@gmail.com')}
                        className="col-span-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Phone Number')} </FormLabel>
                    <FormControl>
                      <Input placeholder={t('+123456789')} className="col-span-4" {...field} />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Role')}</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('Select a role')}
                      className="col-span-4"
                      items={roles.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Password')} </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t('e.g., S3cur3P@ssw0rd')}
                        className="col-span-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">{t('Confirm Password')} </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder={t('e.g., S3cur3P@ssw0rd')}
                        className="col-span-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="submit" form="user-form">
            {t('Save changes')}{' '}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
