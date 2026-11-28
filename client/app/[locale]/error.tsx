"use client";

import { PageError } from "@/components/shared/page-error";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <PageError onRetry={retry} className="min-h-svh" />;
}
