import { routing, type Locale } from '@/i18n/routing';

export type { Locale };

export type MessageValues = Record<string, string | number>;

export const localeTags = { vi: 'vi-VN', en: 'en-US' } as const;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && routing.locales.some((locale) => locale === value);
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}
