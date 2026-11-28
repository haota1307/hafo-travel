import { notFound } from "next/navigation";
import { PageAccess } from "@/features/auth/components/page-access";
import { DashboardList } from "@/features/dashboard/components/dashboard-list";
import { DashboardSampleDataProvider } from "@/features/dashboard/components/dashboard-sample-data";
import { isSampleSection } from "@/features/dashboard/sections";

export default async function DashboardSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ record?: string; queue?: string }>;
}) {
  const { section } = await params;

  if (!isSampleSection(section)) {
    notFound();
  }

  const { record, queue } = await searchParams;

  return (
    <PageAccess scope="dashboard" destination={section}>
      <DashboardSampleDataProvider>
        <DashboardList
          key={section}
          section={section}
          recordId={record}
          queue={queue}
        />
      </DashboardSampleDataProvider>
    </PageAccess>
  );
}
