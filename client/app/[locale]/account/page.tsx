import { AccountScreen } from "@/features/auth/components/account-screen";
import { PageAccess } from "@/features/auth/components/page-access";

export default function AccountPage() {
  return (
    <PageAccess scope="account">
      <AccountScreen />
    </PageAccess>
  );
}
