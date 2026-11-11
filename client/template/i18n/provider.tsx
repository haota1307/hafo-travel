'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { enUS, vi } from 'date-fns/locale';

import { usePathname, useRouter } from '@/i18n/navigation';

import { isLocale, localeTags, type Locale, type MessageValues } from './translate';
import sourceMessageKeys from './source-message-keys.json';

/** Compatibility for existing demo labels/data. New features use useTranslations directly. */
export function useI18n() {
  const currentLocale = useLocale();
  const locale: Locale = isLocale(currentLocale) ? currentLocale : 'vi';
  const translate = useTranslations('template');
  const router = useRouter();
  const pathname = usePathname();
  const setLocale = useCallback(
    (next: Locale) => {
      if (isLocale(next)) {
        router.replace(`${pathname}${window.location.search}${window.location.hash}`, {
          locale: next,
          scroll: false,
        });
      }
    },
    [pathname, router],
  );

  return useMemo(() => {
    const localeTag = localeTags[locale];

    return {
      locale,
      localeTag,
      setLocale,
      dateLocale: locale === 'vi' ? vi : enUS,
      t: (message: string, values: MessageValues = {}) => {
        const normalized = message.replace(/\s+/g, ' ').trim();
        const key = Object.hasOwn(sourceMessageKeys, normalized)
          ? sourceMessageKeys[normalized as keyof typeof sourceMessageKeys]
          : undefined;

        // User names, external data and unknown text are not translation keys.
        if (!key) {
          return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
            Object.hasOwn(values, name) ? String(values[name]) : placeholder,
          );
        }

        return (
          (message.match(/^\s*/)?.[0] ?? '') +
          translate(key, values) +
          (message.match(/\s*$/)?.[0] ?? '')
        );
      },
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(localeTag, options).format(value),
      currency: (value: number, currency = 'USD') =>
        new Intl.NumberFormat(localeTag, { style: 'currency', currency }).format(value),
      date: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(localeTag, options).format(value),
    };
  }, [locale, translate, setLocale]);
}

export function Trans({ message, values }: { message: string; values?: MessageValues }) {
  return useI18n().t(message, values);
}
