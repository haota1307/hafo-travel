'use client';

import { useI18n } from '@/template/i18n/provider';
import { Link } from '@/i18n/navigation';
import useDialogState from '@/template/hooks/use-dialog-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/template/components/ui/avatar';
import { Button } from '@/template/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/template/components/ui/dropdown-menu';
import { SignOutDialog } from '@/template/components/sign-out-dialog';

export function ProfileDropdown() {
  const { t } = useI18n();
  const [open, setOpen] = useDialogState();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/template/avatar.svg" alt="@shadcn" />
              <AvatarFallback>SN</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-none font-medium">{t('satnaing')}</p>
              <p className="text-xs leading-none text-muted-foreground">satnaingdev@gmail.com</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/template/settings">
                {t('Profile')} <DropdownMenuShortcut>{t('⇧⌘P')}</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/template/settings">
                {t('Billing')} <DropdownMenuShortcut>{t('⌘B')}</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/template/settings">
                {t('Settings')} <DropdownMenuShortcut>{t('⌘S')}</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>{t('New Team')}</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            {t('Sign out')}{' '}
            <DropdownMenuShortcut className="text-current">{t('⇧⌘Q')} </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  );
}
