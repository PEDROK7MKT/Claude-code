import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FormSectionProps extends Omit<React.ComponentProps<"section">, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** Nível do título: h2 na página de cadastro, h3 dentro do card "Dados do lead". */
  headingLevel?: "h2" | "h3";
}

/** Bloco do formulário do lead com título e descrição (seções "Contato", "Origem"…). */
export function FormSection({
  title,
  description,
  icon: Icon,
  headingLevel = "h2",
  className,
  children,
  ...props
}: FormSectionProps) {
  const headingId = React.useId();
  const Heading = headingLevel;

  return (
    <section aria-labelledby={headingId} className={cn("grid gap-4", className)} {...props}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            aria-hidden="true"
            className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
          >
            <Icon className="size-4" />
          </span>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          <Heading id={headingId} className="text-foreground text-base leading-8 font-semibold">
            {title}
          </Heading>
          {description ? <p className="text-muted-foreground -mt-1 text-sm text-pretty">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
