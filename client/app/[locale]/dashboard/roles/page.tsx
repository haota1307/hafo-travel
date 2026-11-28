import { readPageSession } from "@/features/auth/auth.server";
import { PageAccess } from "@/features/auth/components/page-access";
import { RolesScreen } from "@/features/roles/components/roles-screen";

export default async function RolesPage() {
  const session = await readPageSession();

  return (
    <PageAccess scope="dashboard" destination="roles">
      {session && typeof session !== "string" && (
        <RolesScreen
          key={session.user.userId}
          actorId={session.user.userId}
          actorRoleId={session.user.roles[0].id}
          permissions={session.permissions}
        />
      )}
    </PageAccess>
  );
}
