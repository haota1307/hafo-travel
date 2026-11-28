import type { useTranslations } from "next-intl";

import { getApiErrorCode } from "@/lib/api-error";
import { HttpError } from "@/lib/http";

import type { RoleSummary } from "./roles.schema";

type RoleLabels = ReturnType<typeof useTranslations<"roles">>;

export function getRoleName(role: RoleSummary, t: RoleLabels, locale: string) {
  if (isSystemRole(role)) {
    return t(`systemNames.${role.name}`);
  }

  const localized = locale === "en" ? role.displayNameEn : role.displayNameVi;
  const alternate = locale === "en" ? role.displayNameVi : role.displayNameEn;

  return (
    localized?.trim() ||
    role.displayName?.trim() ||
    alternate?.trim() ||
    role.name
  );
}

export function getRoleOptionLabel(
  role: RoleSummary,
  t: RoleLabels,
  locale: string,
) {
  const name = getRoleName(role, t, locale);

  return name === role.name ? name : `${name} · ${role.name}`;
}

export function isSystemRole(role: RoleSummary) {
  return role.name === "administrator" || role.name === "client";
}

export function isVisiblePermission(permission: string) {
  return permission !== "user.delete";
}

export function groupRolePermissions(permissions: string[]) {
  return {
    pages: permissions.filter((permission) => permission.startsWith("UI:")),
    api: permissions.filter(
      (permission) =>
        !permission.startsWith("UI:") && isVisiblePermission(permission),
    ),
  };
}

export function getPermissionLabel(permission: string, t: RoleLabels) {
  const key = `permissionNames.${permission.replace(/^UI:/, "").replaceAll(/[/.]/g, "_")}`;

  return t.has(key) ? t(key) : permission;
}

export function getRoleErrorKey(error: unknown, deleting = false) {
  if (error instanceof HttpError) {
    switch (getApiErrorCode(error)) {
      case "ROLE_SYSTEM_PROTECTED":
        return "errors.systemProtected";
      case "ROLE_NAME_RESERVED":
        return "errors.reservedName";
    }

    switch (error.status) {
      case 400:
        return "errors.invalid";
      case 401:
        return "errors.session";
      case 403:
        return "errors.forbidden";
      case 404:
        return "errors.notFound";
      case 409:
        return deleting ? "errors.assigned" : "errors.duplicate";
      case 429:
        return "errors.rateLimit";
    }
  }

  return "errors.unavailable";
}
