import type { useTranslations } from "next-intl";

import { HttpError } from "@/lib/http";

import type { InternalUser } from "./users.schema";

export type UserLabels = ReturnType<typeof useTranslations<"users">>;

export function getUserAccess(permissions: string[]) {
  const invite = permissions.includes("user.create");
  const assign = permissions.includes("user.assign_roles");
  const readRoles = permissions.includes("role.get_all");

  return {
    list: permissions.includes("user.get_all"),
    detail: permissions.includes("user.get_by_id"),
    edit: permissions.includes("user.update"),
    invite: invite && assign && readRoles,
    resend: invite && assign,
    assign: assign && readRoles,
  };
}

export type UserAccess = ReturnType<typeof getUserAccess>;

export type UserEditAction = "editName" | "changeRole";

export type UserAction =
  "viewDetails" | UserEditAction | "lock" | "unlock" | "resendInvitation";

export function getUserName(user: InternalUser, locale: string) {
  const names =
    locale === "vi"
      ? [user.lastName, user.firstName]
      : [user.firstName, user.lastName];

  return names.filter(Boolean).join(" ") || user.email;
}

export function getUserRoleName(name: string, t: UserLabels) {
  return name === "administrator" ? t("administrator") : name;
}

export function getUserErrorKey(error: unknown) {
  if (error instanceof HttpError) {
    switch (error.status) {
      case 401:
        return "errors.session";
      case 403:
        return "errors.forbidden";
      case 404:
        return "errors.notFound";
      case 409:
        return "errors.changed";
      case 429:
        return "errors.rateLimit";
    }
  }

  return "errors.unavailable";
}
