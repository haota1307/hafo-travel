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

import { useDeleteRole } from "../roles.queries";
import type { Role } from "../roles.schema";
import { getRoleErrorKey, getRoleName, isSystemRole } from "../roles-ui";

export type RoleAction = "viewDetails" | "editRole" | "delete";

export type RoleActions = {
  viewDetails: boolean;
  update: boolean;
  delete: boolean;
};

export function RoleActionsMenu({
  role,
  allowed,
  onAction,
}: {
  role: Role;
  allowed: RoleActions;
  onAction: (action: RoleAction, role: Role) => void;
}) {
  const t = useTranslations("roles");
  const locale = useLocale();
  const { container } = useWorkspace();
  const selected = useRef<RoleAction | null>(null);
  const protectedRole = isSystemRole(role);
  const actions: RoleAction[] = [];

  if (allowed.viewDetails) {
    actions.push("viewDetails");
  }
  if (allowed.update && !protectedRole) {
    actions.push("editRole");
  }
  if (allowed.delete && !protectedRole) {
    actions.push("delete");
  }

  if (!container || !actions.length) {
    return null;
  }

  return (
    <DropdownMenu
      modal={false}
      onOpenChangeComplete={(open) => {
        if (!open && selected.current) {
          const action = selected.current;
          selected.current = null;
          onAction(action, role);
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
            aria-label={t("actionsFor", { name: getRoleName(role, t, locale) })}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        portalContainer={container}
        align="end"
        className="w-max"
      >
        {actions.map((action) => (
          <DropdownMenuItem
            key={action}
            variant={action === "delete" ? "destructive" : "default"}
            onClick={() => {
              selected.current = action;
            }}
          >
            {t(action)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DeleteRoleDialog({
  actorId,
  role,
  onClose,
  onDeleted,
}: {
  actorId: string;
  role: Role;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("roles");
  const locale = useLocale();
  const { container } = useWorkspace();
  const mutation = useDeleteRole(actorId, role.id);

  function confirm() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("deleted") });
        onDeleted();
      },
      onError: (error) =>
        toast.add({
          type: "error",
          title: t(getRoleErrorKey(error, true)),
        }),
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
          <DialogTitle>{t("delete")}</DialogTitle>
          <DialogDescription>
            {t("deleteDescription", { name: getRoleName(role, t, locale) })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={mutation.isPending}
          >
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
