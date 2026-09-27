import * as React from "react";

import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";

export interface StatusBadgeProps extends Omit<React.ComponentProps<"span">, "children"> {
  status: LeadStatus;
}

/**
 * Badge de status do lead (spec §12): arredondado, texto em minúsculo,
 * fundo suave com opacidade baixa e texto na cor forte do status.
 */
export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap lowercase ring-1 ring-inset",
        meta.badgeClass,
        className,
      )}
      {...props}
    >
      {meta.label}
    </span>
  );
}
