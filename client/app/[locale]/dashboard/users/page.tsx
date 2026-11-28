import { readPageSession } from "@/features/auth/auth.server";
import { PageAccess } from "@/features/auth/components/page-access";
import { UsersScreen } from "@/features/users/components/users-screen";

export default async function UsersPage() {
  const session = await readPageSession();

  return (
    <PageAccess scope="dashboard" destination="users">
      {session && typeof session !== "string" && (
        <UsersScreen
          key={session.user.userId}
          actorId={session.user.userId}
          permissions={session.permissions}
        />
      )}
    </PageAccess>
  );
}
