'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { zodResolver } from '@hookform/resolvers/zod';

import { useI18n } from '@/template/i18n/provider';
import { showSubmittedData } from '@/template/lib/show-submitted-data';
import { cn } from '@/lib/utils';
import { Button } from '@/template/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/template/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/template/components/ui/form';
import { Input } from '@/template/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/template/components/ui/popover';
import { DatePicker } from '@/template/components/date-picker';

const languages = [
  { label: 'Vietnamese', value: 'vi' },
  { label: 'English', value: 'en' },
] as const;

const accountFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please enter your name.')
    .min(2, 'Name must be at least 2 characters.')
    .max(30, 'Name must not be longer than 30 characters.'),
  dob: z.date('Please select your date of birth.'),
  language: z.enum(['vi', 'en'], 'Please select a language.'),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<AccountFormValues> = {
  name: '',
};

export function AccountForm() {
  const { t, locale, setLocale } = useI18n();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { ...defaultValues, language: locale },
  });

  useEffect(() => {
    form.setValue('language', locale);
  }, [form, locale]);

  function onSubmit(data: AccountFormValues) {
    setLocale(data.language);
    showSubmittedData(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('Your name')} {...field} />
              </FormControl>
              <FormDescription>
                {t('This is the name that will be displayed on your profile and in emails.')}{' '}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('Date of birth')}</FormLabel>
              <DatePicker selected={field.value} onSelect={field.onChange} />
              <FormDescription>
                {t('Your date of birth is used to calculate your age.')}{' '}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('Language')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-50 justify-between',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {t(
                        (field.value
                          ? languages.find((language) => language.value === field.value)?.label
                          : 'Select language') ?? 'Select language',
                      )}
                      <CaretSortIcon className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-50 p-0">
                  <Command>
                    <CommandInput placeholder={t('Search language...')} />
                    <CommandEmpty>{t('No language found.')}</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            keywords={[t(language.label)]}
                            key={language.value}
                            onSelect={() => {
                              form.setValue('language', language.value);
                              setLocale(language.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                'size-4',
                                language.value === field.value ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {t(language.label)}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                {t('This is the language that will be used in the dashboard.')}{' '}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{t('Update account')}</Button>
      </form>
    </Form>
  );
}
