import { notFound } from "next/navigation";
import { readPageSession } from "@/features/auth/auth.server";
import { PageAccess } from "@/features/auth/components/page-access";
import { DashboardList } from "@/features/dashboard/components/dashboard-list";
import { isSection } from "@/features/dashboard/sections";
import { RolesScreen } from "@/features/roles/components/roles-screen";
import { UsersScreen } from "@/features/users/components/users-screen";

export default async function DashboardSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ record?: string; queue?: string }>;
}) {
  const { section } = await params;

  if (!isSection(section)) {
    notFound();
  }

  if (section === "users" || section === "roles") {
    const session = await readPageSession();

    return (
      <PageAccess scope="dashboard" destination={section}>
        {session &&
          typeof session !== "string" &&
          (section === "users" ? (
            <UsersScreen
              key={session.user.userId}
              actorId={session.user.userId}
              permissions={session.permissions}
            />
          ) : (
            <RolesScreen
              key={session.user.userId}
              actorId={session.user.userId}
              actorRoleId={session.user.roles[0].id}
              permissions={session.permissions}
            />
          ))}
      </PageAccess>
    );
  }

  const { record, queue } = await searchParams;

  return (
    <PageAccess scope="dashboard" destination={section}>
      <DashboardList
        key={section}
        section={section}
        recordId={record}
        queue={queue}
      />
    </PageAccess>
  );
}
