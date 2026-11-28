"use client";

import { PageError } from "@/components/shared/page-error";

export default function DashboardError({ retry }: { retry: () => void }) {
  return <PageError onRetry={retry} />;
}
