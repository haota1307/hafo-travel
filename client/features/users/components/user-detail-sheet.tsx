"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { StatusBadge } from "@/features/dashboard/components/record-ui";
import { useWorkspace } from "@/features/dashboard/components/workspace";

import {
  useGetUser,
  useInviteUser,
  useUpdateUsersRole,
} from "../users.queries";
import type { InternalUser } from "../users.schema";
import {
  getUserErrorKey,
  getUserName,
  getUserRoleName,
  type UserAccess,
  type UserEditAction,
} from "../users-ui";
import { EditUserNameForm, InviteUserForm, UserRoleForm } from "./user-forms";

const userStatusColors: Record<InternalUser["status"], string> = {
  active:
    "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300",
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  locked: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
};

export function UserStatusBadge({
  status,
}: {
  status: InternalUser["status"];
}) {
  const t = useTranslations("users");

  return (
    <StatusBadge
      status={status}
      label={t(`statuses.${status}`)}
      className={userStatusColors[status]}
    />
  );
}

export function InviteUserSheet({
  actorId,
  onClose,
}: {
  actorId: string;
  onClose: () => void;
}) {
  const t = useTranslations("users");
  const { container } = useWorkspace();
  const mutation = useInviteUser(actorId);

  if (!container) {
    return null;
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) {
          onClose();
        }
      }}
    >
      <SheetContent
        portalContainer={container}
        className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="gap-1 border-b p-5 pe-12">
          <SheetTitle className="text-xl font-semibold">
            {t("invite")}
          </SheetTitle>
          <SheetDescription>{t("inviteDescription")}</SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-6">
          <InviteUserForm
            actorId={actorId}
            mutation={mutation}
            onDone={onClose}
            onCancel={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UserDetailSheet({
  actorId,
  recordId,
  access,
  editAction,
  onEditDone,
  onClose,
}: {
  actorId: string;
  recordId: string;
  access: UserAccess;
  editAction?: UserEditAction;
  onEditDone: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("users");
  const locale = useLocale();
  const { container } = useWorkspace();
  const detail = useGetUser(actorId, recordId);
  const user = detail.isSuccess ? detail.data : undefined;

  if (!container) {
    return null;
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        portalContainer={container}
        className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="gap-1 border-b p-5 pe-12">
          <SheetDescription>{t("detail")}</SheetDescription>
          <SheetTitle className="text-xl font-semibold">
            {user ? getUserName(user, locale) : t("account")}
          </SheetTitle>
        </SheetHeader>
        <div className="grid gap-5 px-5 pb-6">
          {detail.isLoading && <p role="status">{t("loadingDetail")}</p>}
          {detail.isError && (
            <div className="grid justify-items-start gap-2">
              <p role="alert">{t(getUserErrorKey(detail.error))}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => detail.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          )}
          {user && (
            <UserDetail
              user={user}
              actorId={actorId}
              access={access}
              editAction={editAction}
              onEditDone={onEditDone}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UserDetail({
  user,
  actorId,
  access,
  editAction,
  onEditDone,
}: {
  user: InternalUser;
  actorId: string;
  access: UserAccess;
  editAction?: UserEditAction;
  onEditDone: () => void;
}) {
  const t = useTranslations("users");
  const format = useFormatter();
  const role = useUpdateUsersRole(actorId);
  const protectedAccess = user.accessProtected || user.userId === actorId;
  const editingName = editAction === "editName" && access.edit;
  const editingRole =
    editAction === "changeRole" && access.assign && !protectedAccess;
  const dateFormat = { dateStyle: "medium", timeStyle: "short" } as const;
  const fields = [
    { label: t("fields.email"), value: user.email },
    { label: t("fields.role"), value: getUserRoleName(user.role.name, t) },
    {
      label: t("fields.createdAt"),
      value: format.dateTime(new Date(user.createdAt), dateFormat),
    },
    {
      label: t("fields.updatedAt"),
      value: format.dateTime(new Date(user.updatedAt), dateFormat),
    },
  ];

  function changeRole(roleId: string) {
    role.mutate(
      { userIds: [user.userId], roleId },
      {
        onSuccess: ({ updated, failures }) => {
          if (!updated.length) {
            toast.add({
              type: "error",
              title: t(getUserErrorKey(failures.get(user.userId))),
            });

            return;
          }

          toast.add({ type: "success", title: t("roleUpdated") });
          onEditDone();
        },
      },
    );
  }

  return (
    <>
      <div>
        <UserStatusBadge status={user.status} />
      </div>
      <dl className="divide-y rounded-lg border px-3">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1.3fr)] items-baseline gap-3 py-2.5"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="break-words text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {editingName && (
        <EditUserNameForm actorId={actorId} user={user} onDone={onEditDone} />
      )}
      {editingRole && (
        <UserRoleForm
          actorId={actorId}
          currentRole={user.role.id}
          pending={role.isPending}
          onSubmit={changeRole}
          onCancel={onEditDone}
        />
      )}
    </>
  );
}
