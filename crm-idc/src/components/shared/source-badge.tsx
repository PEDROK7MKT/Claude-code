import * as React from "react";

import { SOURCE_COLORS, SOURCE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadSource } from "@/types/database";

export interface SourceBadgeProps extends Omit<React.ComponentProps<"span">, "children"> {
  source: LeadSource;
  /** `badge` (padrão): pílula com borda · `plain`: só bolinha + texto (tabelas, cards do kanban) */
  variant?: "badge" | "plain";
}

/** Origem do lead com a bolinha na cor da fonte (mesma cor dos gráficos). */
export function SourceBadge({ source, variant = "badge", className, ...props }: SourceBadgeProps) {
  return (
    <span
      data-slot="source-badge"
      data-source={source}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        variant === "badge" && "bg-card text-foreground rounded-full border px-2.5 py-0.5",
        variant === "plain" && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: SOURCE_COLORS[source] }} />
      {SOURCE_LABEL[source]}
    </span>
  );
}
