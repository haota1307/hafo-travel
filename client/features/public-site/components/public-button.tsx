"use client";

import type { ComponentProps } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type PublicButtonProps = Omit<
  ComponentProps<typeof Button>,
  "render" | "nativeButton"
> & {
  href?: ComponentProps<typeof Link>["href"];
  withArrow?: boolean;
};

export function PublicButton({
  href,
  children,
  className,
  size = "lg",
  withArrow = true,
  ...props
}: PublicButtonProps) {
  return (
    <Button
      {...props}
      size={size}
      className={cn("public-button", className)}
      {...(href ? { nativeButton: false, render: <Link href={href} /> } : {})}
    >
      {children}
      {withArrow && <ArrowUpRight data-icon="inline-end" aria-hidden="true" />}
    </Button>
  );
}
