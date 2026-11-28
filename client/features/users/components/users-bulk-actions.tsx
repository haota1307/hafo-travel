"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, ShieldCheck } from "lucide-react";

import { DataTableBulkActions } from "@/components/shared/data-table/bulk-actions";
import type { Table } from "@/components/shared/data-table/table-features";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useWorkspace } from "@/features/dashboard/components/workspace";
import { downloadCsv } from "@/lib/download-csv";

import { useUpdateUsersRole } from "../users.queries";
import type { InternalUser } from "../users.schema";
import { getUserErrorKey, getUserName, getUserRoleName } from "../users-ui";
import { UserRoleForm } from "./user-forms";

type RoleResult = {
  counts: string;
  failures: { userId: string; name: string; message: string }[];
};

export function UsersBulkActions({
  table,
  actorId,
  canAssignRole,
}: {
  table: Table<InternalUser>;
  actorId: string;
  canAssignRole: boolean;
}) {
  const t = useTranslations("users");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const { container } = useWorkspace();
  const mutation = useUpdateUsersRole(actorId);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<RoleResult | null>(null);
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const eligible = selected.filter(
    (user) => !user.accessProtected && user.userId !== actorId,
  );

  function exportSelected() {
    const fields = [
      { id: "name", get: (user: InternalUser) => getUserName(user, locale) },
      { id: "email", get: (user: InternalUser) => user.email },
      {
        id: "role",
        get: (user: InternalUser) => getUserRoleName(user.role.name, t),
      },
      {
        id: "status",
        get: (user: InternalUser) => t(`statuses.${user.status}`),
      },
    ] as const;
    const visible = fields.filter(({ id }) =>
      table.getColumn(id)?.getIsVisible(),
    );
    downloadCsv("users", [
      ["ID", ...visible.map(({ id }) => t(`fields.${id}`))],
      ...selected.map((user) => [
        user.userId,
        ...visible.map(({ get }) => get(user)),
      ]),
    ]);
    table.resetRowSelection();
  }

  function changeRole(roleId: string) {
    const targets = eligible.filter((user) => user.role.id !== roleId);
    const skipped = selected.length - targets.length;

    if (!targets.length) {
      setResult({
        counts: t("bulkRoleCounts", { changed: 0, skipped, failed: 0 }),
        failures: [],
      });

      return;
    }

    mutation.mutate(
      { roleId, userIds: targets.map((user) => user.userId) },
      {
        onSuccess: ({ updated, failures }) => {
          const counts = t("bulkRoleCounts", {
            changed: updated.length,
            skipped,
            failed: failures.size,
          });
          table.setRowSelection((previous) => {
            const next = { ...previous };

            for (const user of updated) {
              delete next[user.userId];
            }

            return next;
          });

          if (failures.size) {
            setResult({
              counts,
              failures: targets
                .filter((user) => failures.has(user.userId))
                .map((user) => ({
                  userId: user.userId,
                  name: getUserName(user, locale),
                  message: t(getUserErrorKey(failures.get(user.userId))),
                })),
            });

            return;
          }

          setOpen(false);
          toast.add({
            type: "success",
            title: t("bulkRoleResult"),
            description: counts,
          });
        },
      },
    );
  }

  function closeDialog() {
    setOpen(false);
    setResult(null);
  }

  return (
    <>
      <DataTableBulkActions
        count={selected.length}
        container={container}
        entity={dashboard("bulkEntity", {
          section: "users",
          count: selected.length,
        })}
        onClear={() => table.resetRowSelection()}
      >
        {canAssignRole && eligible.length > 0 && (
          <LabeledTooltip label={t("bulkRole")} portalContainer={container}>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label={t("bulkRole")}
              onClick={() => setOpen(true)}
            >
              <ShieldCheck />
            </Button>
          </LabeledTooltip>
        )}
        <LabeledTooltip
          label={dashboard("exportSelected")}
          portalContainer={container}
        >
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={dashboard("exportSelected")}
            onClick={exportSelected}
          >
            <Download />
          </Button>
        </LabeledTooltip>
      </DataTableBulkActions>
      {container && canAssignRole && (
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !mutation.isPending) {
              closeDialog();
            }
          }}
        >
          <DialogContent portalContainer={container} showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>
                {t(result ? "bulkRoleResult" : "bulkRole")}
              </DialogTitle>
              <DialogDescription>
                {result?.counts ??
                  t("bulkRoleDescription", { count: eligible.length })}
              </DialogDescription>
            </DialogHeader>
            {result ? (
              <>
                {!!result.failures.length && (
                  <ul className="max-h-60 space-y-2 overflow-y-auto">
                    {result.failures.map(({ userId, name, message }) => (
                      <li key={userId}>
                        <strong className="block font-medium">{name}</strong>
                        <p className="text-muted-foreground">{message}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <DialogFooter>
                  <Button onClick={closeDialog}>{t("close")}</Button>
                </DialogFooter>
              </>
            ) : (
              open && (
                <UserRoleForm
                  actorId={actorId}
                  pending={mutation.isPending}
                  onSubmit={changeRole}
                  onCancel={closeDialog}
                />
              )
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
