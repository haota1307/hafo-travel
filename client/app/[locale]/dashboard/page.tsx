import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { PageAccess } from "@/features/auth/components/page-access";

export default function DashboardPage() {
  return (
    <PageAccess scope="dashboard" destination="overview">
      <DashboardOverview />
    </PageAccess>
  );
}
