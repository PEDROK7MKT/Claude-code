import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Botões/filtros à direita do título; no mobile quebram para baixo do título. */
  actions?: React.ReactNode;
  /** Conteúdo acima do título (ex.: Breadcrumb ou link "Voltar"). */
  breadcrumb?: React.ReactNode;
}

export function PageHeader({ title, description, actions, breadcrumb, className, children, ...props }: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn("flex flex-col gap-3", className)} {...props}>
      {breadcrumb}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance break-words">{title}</h1>
          {description ? <p className="text-muted-foreground text-sm text-pretty">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
