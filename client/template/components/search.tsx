"use client";

import { HeaderSearchButton } from "@/components/shared/header-search-button";

import { useI18n } from "@/template/i18n/provider";
import { useSearch } from "@/template/context/search-provider";

export function Search({
  className = "",
  placeholder = "Search",
  ...props
}: React.ComponentProps<"button"> & { placeholder?: string }) {
  const { t } = useI18n();
  const { setOpen } = useSearch();

  return (
    <HeaderSearchButton
      {...props}
      label={t(placeholder)}
      className={className}
      onClick={() => setOpen(true)}
    />
  );
}
