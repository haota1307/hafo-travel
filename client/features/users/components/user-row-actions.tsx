"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { useWorkspace } from "@/features/dashboard/components/workspace";

import {
  getUserErrorKey,
  getUserName,
  type UserAccess,
  type UserAction,
} from "../users-ui";
import { useUpdateUserStatus } from "../users.queries";
import type { InternalUser } from "../users.schema";

export function UserActionsMenu({
  actorId,
  user,
  access,
  resendingInvitation,
  onAction,
}: {
  actorId: string;
  user: InternalUser;
  access: UserAccess;
  resendingInvitation: boolean;
  onAction: (action: UserAction, user: InternalUser) => void;
}) {
  const t = useTranslations("users");
  const locale = useLocale();
  const { container } = useWorkspace();
  const selected = useRef<UserAction | null>(null);
  const protectedAccess = user.accessProtected || user.userId === actorId;
  const actions: UserAction[] = ["viewDetails"];

  if (access.edit) {
    actions.push("editName");
  }
  if (access.assign && !protectedAccess) {
    actions.push("changeRole");
  }
  if (access.edit && !protectedAccess) {
    actions.push(user.status === "locked" ? "unlock" : "lock");
  }
  if (access.resend && user.status === "pending") {
    actions.push("resendInvitation");
  }

  return (
    <DropdownMenu
      modal={false}
      onOpenChangeComplete={(open) => {
        if (!open && selected.current) {
          const action = selected.current;
          selected.current = null;
          onAction(action, user);
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 data-popup-open:bg-accent"
            aria-label={t("actionsFor", { name: getUserName(user, locale) })}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      {container && (
        <DropdownMenuContent
          portalContainer={container}
          align="end"
          className="w-max"
        >
          {actions.map((action) => (
            <DropdownMenuItem
              key={action}
              variant={action === "lock" ? "destructive" : "default"}
              disabled={action === "resendInvitation" && resendingInvitation}
              onClick={() => {
                selected.current = action;
              }}
            >
              {t(action)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

export function UserStatusDialog({
  actorId,
  user,
  action,
  onClose,
}: {
  actorId: string;
  user: InternalUser;
  action: "lock" | "unlock";
  onClose: () => void;
}) {
  const t = useTranslations("users");
  const locale = useLocale();
  const { container } = useWorkspace();
  const mutation = useUpdateUserStatus(actorId, user.userId);
  const locking = action === "lock";

  function confirm() {
    mutation.mutate(locking, {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: t(locking ? "locked" : "unlocked"),
        });
        onClose();
      },
      onError: (error) =>
        toast.add({ type: "error", title: t(getUserErrorKey(error)) }),
    });
  }

  if (!container) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) {
          onClose();
        }
      }}
    >
      <DialogContent portalContainer={container} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t(action)}</DialogTitle>
          <DialogDescription>
            {t(locking ? "lockDescription" : "unlockDescription", {
              name: getUserName(user, locale),
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          <Button
            variant={locking ? "destructive" : "default"}
            disabled={mutation.isPending}
            onClick={confirm}
          >
            {t(action)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
