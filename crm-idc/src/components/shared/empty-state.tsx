import * as React from "react";
import Link from "next/link";
import { InboxIcon, type LucideIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  /** Navega para a rota (renderiza <Link>). */
  href?: string;
  /** Ação no cliente (use apenas em Client Components). */
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** CTA principal (spec §5: "Empty states com ilustração + CTA"). */
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** `sm` para uso dentro de cards/gráficos. */
  size?: "default" | "sm";
}

/** Estado vazio com ilustração nas cores da marca e CTA opcional. */
export function EmptyState({
  icon = InboxIcon,
  title,
  description,
  action,
  secondaryAction,
  size = "default",
  className,
  children,
  ...props
}: EmptyStateProps) {
  const compact = size === "sm";

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 px-4 py-6" : "gap-4 px-6 py-12",
        className,
      )}
      {...props}
    >
      <EmptyIllustration icon={icon} compact={compact} />
      <div className={cn("max-w-sm", compact ? "space-y-1" : "space-y-1.5")}>
        <h3 className={cn("text-foreground font-semibold text-balance", compact ? "text-sm" : "text-base")}>{title}</h3>
        {description ? (
          <p className={cn("text-muted-foreground text-pretty", compact ? "text-xs" : "text-sm")}>{description}</p>
        ) : null}
      </div>
      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action ? <EmptyStateButton action={action} size={compact ? "sm" : "default"} /> : null}
          {secondaryAction ? (
            <EmptyStateButton
              action={{ variant: "outline", ...secondaryAction }}
              size={compact ? "sm" : "default"}
            />
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function EmptyStateButton({ action, size }: { action: EmptyStateAction; size: "sm" | "default" }) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Button asChild variant={action.variant} size={size}>
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant={action.variant} size={size} onClick={action.onClick}>
      {content}
    </Button>
  );
}

/** Composição de formas + ícone (teal) com detalhes dourados — sem imagens externas. */
function EmptyIllustration({ icon: Icon, compact }: { icon: LucideIcon; compact: boolean }) {
  return (
    <div aria-hidden="true" className={cn("relative shrink-0", compact ? "size-24" : "size-32")}>
      <div
        className={cn(
          "absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2",
          compact && "scale-75",
        )}
      >
        <div className="bg-primary/5 absolute inset-0 rounded-full" />
        <div className="bg-primary/10 absolute inset-4 rounded-full" />
        <div className="border-primary/15 bg-card/80 absolute top-9 left-5 h-14 w-16 -rotate-12 rounded-xl border shadow-sm" />
        <div className="border-primary/20 bg-card absolute top-8 left-1/2 flex size-16 -translate-x-1/2 rotate-6 items-center justify-center rounded-2xl border shadow-md">
          <Icon className="text-primary size-8" strokeWidth={1.75} />
        </div>
        <SparklesIcon className="text-gold absolute top-3 right-4 size-5" />
        <span className="bg-gold/70 absolute bottom-6 left-4 size-2.5 rounded-full" />
        <span className="bg-primary/40 absolute top-7 left-3 size-1.5 rounded-full" />
        <span className="bg-primary/30 absolute right-5 bottom-8 size-2 rounded-full" />
      </div>
    </div>
  );
}
