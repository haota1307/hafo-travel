import { PageAccess } from "@/features/auth/components/page-access";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { DashboardSampleDataProvider } from "@/features/dashboard/components/dashboard-sample-data";

export default function DashboardPage() {
  return (
    <PageAccess scope="dashboard" destination="overview">
      <DashboardSampleDataProvider>
        <DashboardOverview />
      </DashboardSampleDataProvider>
    </PageAccess>
  );
}
