"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { PageError } from "@/components/shared/page-error";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/features/dashboard/components/record-ui";
import { dashboardPath } from "@/features/dashboard/sections";
import { useRouter } from "@/i18n/navigation";

import { RoleIdSchema, type Role } from "../roles.schema";
import { DeleteRoleDialog, type RoleAction } from "./role-actions";
import { CreateRoleSheet, RoleDetailSheet } from "./role-sheet";
import { RolesTable } from "./roles-table";

export function RolesScreen({
  actorId,
  actorRoleId,
  permissions,
}: {
  actorId: string;
  actorRoleId: string;
  permissions: string[];
}) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const params = useSearchParams();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string>();
  const [deleting, setDeleting] = useState<Role>();
  const canList = permissions.includes("role.get_all");
  const canCreate = canList && permissions.includes("role.create");
  const canView = permissions.includes("role.get_by_id");
  const canUpdate = canView && canList && permissions.includes("role.update");
  const canDelete = permissions.includes("role.delete");
  const canViewAccounts =
    permissions.includes("UI:dashboard/users") &&
    permissions.includes("user.get_all");
  const allowed = useMemo(
    () => ({
      viewDetails: canView,
      update: canUpdate,
      delete: canDelete,
    }),
    [canView, canUpdate, canDelete],
  );
  const records = params.getAll("record");
  const recordId =
    canView && records.length === 1
      ? RoleIdSchema.safeParse(records[0]).data?.toLowerCase()
      : undefined;

  const openRecord = useCallback(
    (id?: string) => {
      const url = new URL(window.location.href);

      if (id) {
        url.searchParams.set("record", id);
      } else {
        url.searchParams.delete("record");
      }

      router.replace(dashboardPath("roles") + url.search + url.hash, {
        scroll: false,
      });
    },
    [router],
  );

  const handleAction = useCallback(
    (action: RoleAction, role: Role) => {
      if (action === "delete") {
        setDeleting(role);

        return;
      }

      setEditingRoleId(action === "editRole" ? role.id : undefined);
      openRecord(role.id);
    },
    [openRecord],
  );

  return (
    <>
      <PageHeading
        title={dashboard("nav.roles")}
        description={dashboard("descriptions.roles")}
        action={
          canCreate && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              {t("add")}
            </Button>
          )
        }
      />
      {canList ? (
        <RolesTable
          actorId={actorId}
          allowed={allowed}
          onAction={handleAction}
        />
      ) : (
        <PageError status={403} description={t("noAccess")} />
      )}
      {creating && canCreate ? (
        <CreateRoleSheet actorId={actorId} onClose={() => setCreating(false)} />
      ) : (
        recordId && (
          <RoleDetailSheet
            key={recordId}
            actorId={actorId}
            roleId={recordId}
            editing={editingRoleId === recordId}
            canUpdate={canUpdate}
            canViewAccounts={canViewAccounts}
            onCancelEdit={() => setEditingRoleId(undefined)}
            onSaved={() => {
              setEditingRoleId(undefined);

              if (actorRoleId === recordId) {
                router.refresh();
              }
            }}
            onClose={() => {
              setEditingRoleId(undefined);
              openRecord();
            }}
          />
        )
      )}
      {deleting && canDelete && (
        <DeleteRoleDialog
          actorId={actorId}
          role={deleting}
          onClose={() => setDeleting(undefined)}
          onDeleted={() => {
            setDeleting(undefined);

            if (recordId === deleting.id) {
              setEditingRoleId(undefined);
              openRecord();
            }
          }}
        />
      )}
    </>
  );
}
