import { readPageSession } from "@/features/auth/auth.server";
import { PageAccess } from "@/features/auth/components/page-access";
import { PermissionsScreen } from "@/features/roles/components/permissions-screen";

export default async function PermissionsPage() {
  const session = await readPageSession();

  return (
    <PageAccess scope="dashboard" destination="permissions">
      {session && typeof session !== "string" && (
        <PermissionsScreen
          key={session.user.userId}
          actorId={session.user.userId}
          actorRoleId={session.user.roles[0].id}
          permissions={session.permissions}
        />
      )}
    </PageAccess>
  );
}
