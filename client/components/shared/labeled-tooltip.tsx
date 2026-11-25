"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LabeledTooltip({
  label,
  children,
  portalContainer,
  side,
}: {
  label: string;
  children: React.ReactElement;
  portalContainer?: React.ComponentProps<
    typeof TooltipContent
  >["portalContainer"];
  side?: React.ComponentProps<typeof TooltipContent>["side"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} portalContainer={portalContainer}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
