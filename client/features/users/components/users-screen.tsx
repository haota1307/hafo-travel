"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { PageError } from "@/components/shared/page-error";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PageHeading } from "@/components/shared/page-heading";
import { dashboardPath } from "@/features/dashboard/sections";
import { useRouter } from "@/i18n/navigation";

import { UserIdSchema, type InternalUser } from "../users.schema";
import {
  getUserAccess,
  getUserErrorKey,
  type UserAction,
  type UserEditAction,
} from "../users-ui";
import { useResendUserInvitation } from "../users.queries";
import { InviteUserSheet } from "./invite-user-sheet";
import { UserDetailSheet } from "./user-detail-sheet";
import { showInvitationResult } from "./user-forms";
import { UserStatusDialog } from "./user-row-actions";
import { UsersTable } from "./users-table";

export function UsersScreen({
  actorId,
  permissions,
}: {
  actorId: string;
  permissions: string[];
}) {
  const t = useTranslations("users");
  const locale = useLocale();
  const dashboard = useTranslations("dashboard");
  const params = useSearchParams();
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [edit, setEdit] = useState<{
    userId: string;
    action: UserEditAction;
  } | null>(null);
  const [statusChange, setStatusChange] = useState<{
    user: InternalUser;
    action: "lock" | "unlock";
  } | null>(null);
  const { mutate: resendInvitation, isPending: resendingInvitation } =
    useResendUserInvitation(actorId);
  const access = getUserAccess(permissions);
  const records = params.getAll("record");
  const recordId =
    access.detail && records.length === 1
      ? UserIdSchema.safeParse(records[0]).data
      : undefined;
  const openRecord = useCallback(
    (userId?: string, action?: UserEditAction) => {
      const query = new URLSearchParams(window.location.search);
      setEdit(userId && action ? { userId, action } : null);

      if (userId) {
        query.set("record", userId);
      } else {
        query.delete("record");
      }

      router.replace(
        dashboardPath("users") + (query.size ? "?" + query.toString() : ""),
        {
          scroll: false,
        },
      );
    },
    [router],
  );

  const handleAction = useCallback(
    (action: UserAction, user: InternalUser) => {
      switch (action) {
        case "viewDetails":
          openRecord(user.userId);
          break;
        case "editName":
        case "changeRole":
          openRecord(user.userId, action);
          break;
        case "lock":
        case "unlock":
          setStatusChange({ user, action });
          break;
        case "resendInvitation":
          if (!resendingInvitation) {
            resendInvitation(
              { userId: user.userId, locale },
              {
                onSuccess: (result) => showInvitationResult(result, t),
                onError: (error) =>
                  toast.add({
                    type: "error",
                    title: t(getUserErrorKey(error)),
                  }),
              },
            );
          }

          break;
      }
    },
    [locale, openRecord, resendInvitation, resendingInvitation, t],
  );

  return (
    <>
      <PageHeading
        title={dashboard("nav.users")}
        description={dashboard("descriptions.users")}
        action={
          access.invite && (
            <Button onClick={() => setInviting(true)}>
              <Plus />
              {t("invite")}
            </Button>
          )
        }
      />
      {access.list ? (
        <UsersTable
          actorId={actorId}
          access={access}
          resendingInvitation={resendingInvitation}
          onAction={handleAction}
        />
      ) : (
        <PageError status={403} description={t("noAccess")} />
      )}
      {inviting && access.invite ? (
        <InviteUserSheet actorId={actorId} onClose={() => setInviting(false)} />
      ) : (
        recordId && (
          <UserDetailSheet
            key={recordId}
            actorId={actorId}
            recordId={recordId}
            access={access}
            editAction={
              edit && edit.userId === recordId ? edit.action : undefined
            }
            onEditDone={() => setEdit(null)}
            onClose={() => openRecord()}
          />
        )
      )}
      {statusChange && access.detail && access.edit && (
        <UserStatusDialog
          actorId={actorId}
          user={statusChange.user}
          action={statusChange.action}
          onClose={() => setStatusChange(null)}
        />
      )}
    </>
  );
}
