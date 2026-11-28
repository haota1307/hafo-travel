"use client";

import { useLocale, useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  applyPermissionChanges,
  getOtherPermissions,
  getPermissionRows,
  getPermissionSelection,
  permissionActions,
} from "../role-permissions";
import {
  getPermissionLabel,
  getRoleName,
  isSystemRole,
  isVisiblePermission,
} from "../roles-ui";
import type { Role, RolePermissionChanges } from "../roles.schema";

const featureColumn =
  "sticky start-0 z-10 w-48 min-w-36 max-w-48 px-3 whitespace-normal sm:min-w-48";

function PermissionCheckbox({
  permissions,
  selected,
  label,
  disabled,
  onChange,
}: {
  permissions: string[];
  selected: ReadonlySet<string>;
  label: string;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { checked, partial } = getPermissionSelection(permissions, selected);

  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      indeterminate={partial}
      disabled={disabled}
      onCheckedChange={onChange}
      className={
        partial
          ? "border-primary bg-primary text-primary-foreground before:h-0.5 before:w-2 before:rounded-sm before:bg-current dark:bg-primary [&>[data-slot=checkbox-indicator]]:hidden"
          : undefined
      }
    />
  );
}

export function PermissionMatrix({
  roles,
  catalog,
  pending,
  editable,
  onChange,
}: {
  roles: Role[];
  catalog: ReadonlySet<string>;
  pending?: { id: string; permissions: RolePermissionChanges };
  editable: boolean;
  onChange: (role: Role, permissions: string[], checked: boolean) => void;
}) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const rows = getPermissionRows(catalog);
  const otherPermissions = getOtherPermissions(
    [...catalog, ...roles.flatMap(({ permissions }) => permissions)],
    rows,
  ).filter(isVisiblePermission);
  const actions = permissionActions.flatMap((action) => {
    const permissions = rows.flatMap((row) => row.actions.get(action) ?? []);

    return permissions.length > 0
      ? [{ action, permissions, label: t(`permissionControls.${action}`) }]
      : [];
  });
  const columnCount = Math.max(actions.length, 1);
  const columns = roles.map((role) => {
    const changes = pending?.id === role.id ? pending.permissions : undefined;

    return {
      role,
      name: getRoleName(role, t, locale),
      system: isSystemRole(role),
      changes,
      selected: new Set(
        changes
          ? applyPermissionChanges(role.permissions, changes)
          : role.permissions,
      ),
    };
  });

  function renderRow(
    key: string,
    name: string,
    cells: { label: string; permissions?: string[] }[],
  ) {
    return (
      <TableRow key={key} className="group/row">
        <TableHead
          scope="row"
          className={cn(
            featureColumn,
            "border-b bg-background py-2 wrap-break-word group-hover/row:bg-muted",
          )}
        >
          {name}
        </TableHead>
        {columns.flatMap(
          ({ role, name: roleName, system, selected, changes }) =>
            cells.map(({ label, permissions }, index) => (
              <TableCell
                key={`${role.id}-${index}`}
                colSpan={cells.length === 1 ? columnCount : 1}
                className={cn(
                  "border-b text-center [&:has([role=checkbox])]:pr-2",
                  index === 0 && "border-s",
                  permissions?.some((permission) => changes?.has(permission)) &&
                    "bg-primary/10",
                )}
              >
                {permissions ? (
                  <div className="flex justify-center">
                    <PermissionCheckbox
                      label={t("matrix.checkbox", {
                        role: roleName,
                        feature: name,
                        action: label,
                      })}
                      permissions={permissions}
                      selected={selected}
                      disabled={
                        !editable ||
                        system ||
                        permissions.some(
                          (permission) =>
                            !catalog.has(permission) &&
                            !role.permissions.includes(permission),
                        )
                      }
                      onChange={(value) => onChange(role, permissions, value)}
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            )),
        )}
      </TableRow>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border [&>[data-slot=table-container]]:max-h-[min(65dvh,40rem)]">
      <Table
        className="border-separate border-spacing-0"
        aria-label={dashboard("nav.permissions")}
        aria-busy={!!pending}
      >
        <colgroup span={1} />
        {columns.map(({ role }) => (
          <colgroup key={role.id} span={columnCount} />
        ))}
        <TableHeader className="sticky top-0 z-20 bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead
              rowSpan={actions.length ? 2 : 1}
              scope="col"
              className={cn(featureColumn, "border-b bg-background")}
            >
              {t("matrix.feature")}
            </TableHead>
            {columns.map(({ role, name, system }) => (
              <TableHead
                key={role.id}
                scope="colgroup"
                colSpan={columnCount}
                className="border-s border-b px-3 py-2 text-center whitespace-normal"
              >
                <span className="wrap-break-word font-semibold">{name}</span>
                {system && (
                  <span className="ms-1.5 whitespace-nowrap rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t("matrix.systemRole")}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
          {actions.length > 0 && (
            <TableRow className="hover:bg-transparent">
              {columns.flatMap(({ role, name, selected, system }) =>
                actions.map(({ action, label, permissions }, index) => (
                  <TableHead
                    key={`${role.id}-${action}`}
                    scope="col"
                    className={cn(
                      "min-w-12 border-b px-2 py-1.5 text-center text-xs text-muted-foreground [&:has([role=checkbox])]:pr-2",
                      index === 0 && "border-s",
                    )}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {label}
                      <PermissionCheckbox
                        label={t("matrix.columnCheckbox", {
                          role: name,
                          action: label,
                        })}
                        permissions={permissions}
                        selected={selected}
                        disabled={!editable || system}
                        onChange={(value) => onChange(role, permissions, value)}
                      />
                    </div>
                  </TableHead>
                )),
              )}
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {rows.map(({ page, actions: rowActions }) =>
            renderRow(
              page,
              dashboard(`nav.${page}`),
              actions.map(({ action, label }) => ({
                label,
                permissions: rowActions.get(action),
              })),
            ),
          )}
          {otherPermissions.length > 0 && (
            <TableRow className="bg-muted/50">
              <TableHead
                scope="row"
                className={cn(featureColumn, "border-b bg-muted")}
              >
                {t("permissionControls.other")}
              </TableHead>
              <TableCell
                colSpan={columnCount * columns.length}
                className="border-b"
              />
            </TableRow>
          )}
          {otherPermissions.map((permission) =>
            renderRow(permission, getPermissionLabel(permission, t), [
              { label: t("matrix.allow"), permissions: [permission] },
            ]),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
