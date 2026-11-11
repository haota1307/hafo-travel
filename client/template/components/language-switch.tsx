'use client';

import { Languages } from 'lucide-react';

import { useI18n } from '../i18n/provider';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { isLocale } from '../i18n/translate';

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('Change language')}
          title={t('Change language')}
        >
          <Languages className="size-4" />
          <span className="hidden sm:inline">{locale === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          <span className="sm:hidden">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            if (isLocale(value)) {
              setLocale(value);
            }
          }}
        >
          <DropdownMenuRadioItem value="vi">
            <span lang="vi">Tiếng Việt</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">
            <span lang="en">English</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StandaloneLanguageSwitch() {
  return (
    <div className="absolute top-3 end-3 z-50 rounded-md bg-background/95">
      <LanguageSwitch />
    </div>
  );
}
