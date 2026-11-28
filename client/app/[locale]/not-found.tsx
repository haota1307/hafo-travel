import { PageError } from "@/components/shared/page-error";

export default function NotFoundPage() {
  return <PageError status={404} className="min-h-svh" />;
}
