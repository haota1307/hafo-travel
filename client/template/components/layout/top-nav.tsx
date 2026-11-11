'use client';

import { Menu } from 'lucide-react';

import { useI18n } from '@/template/i18n/provider';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/template/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/template/components/ui/dropdown-menu';

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: {
    title: string;
    href: string;
    isActive: boolean;
    disabled?: boolean;
  }[];
};

export function TopNav({ className, links, ...props }: TopNavProps) {
  const { t } = useI18n();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" className={cn('md:size-7 lg:hidden', className)}>
            <Menu />
            <span className="sr-only">{t('Toggle navigation menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          {links.map(({ title, href, isActive, disabled }) => (
            <DropdownMenuItem key={`${title}-${href}`} asChild>
              <Link
                href={href}
                className={!isActive ? 'text-muted-foreground' : ''}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : undefined}
                onClick={(event) => {
                  if (disabled) {
                    event.preventDefault();
                  }
                }}
              >
                {t(title)}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <nav
        className={cn('hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6', className)}
        {...props}
      >
        {links.map(({ title, href, isActive, disabled }) => (
          <Link
            key={`${title}-${href}`}
            href={href}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            onClick={(event) => {
              if (disabled) {
                event.preventDefault();
              }
            }}
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? '' : 'text-muted-foreground'}`}
          >
            {t(title)}
          </Link>
        ))}
      </nav>
    </>
  );
}
