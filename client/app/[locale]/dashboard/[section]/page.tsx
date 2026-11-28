import { notFound } from "next/navigation";
import { readPageSession } from "@/features/auth/auth.server";
import { PageAccess } from "@/features/auth/components/page-access";
import { DashboardList } from "@/features/dashboard/components/dashboard-list";
import { isSection } from "@/features/dashboard/sections";
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

  const { record, queue } = await searchParams;
  const session = section === "users" ? await readPageSession() : null;

  return (
    <PageAccess scope="dashboard" destination={section}>
      {section === "users" ? (
        session &&
        typeof session !== "string" && (
          <UsersScreen
            key={session.user.userId}
            actorId={session.user.userId}
            permissions={session.permissions}
          />
        )
      ) : (
        <DashboardList
          key={section}
          section={section}
          recordId={record}
          queue={queue}
        />
      )}
    </PageAccess>
  );
}
