import { AuthenticatedLayout } from '@/template/components/layout/authenticated-layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
