import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandBackdrop } from "./brand-backdrop";
import { BrandLogo } from "./brand-logo";

export interface StatusPageProps extends Omit<React.ComponentProps<"div">, "title"> {
  icon: LucideIcon;
  /** Destaque acima do título (ex.: "404", "Erro"). */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Botões/links (ex.: "Voltar ao dashboard", "Tentar novamente"). */
  actions?: React.ReactNode;
  /** Detalhe técnico discreto (ex.: código do erro para o suporte). */
  details?: React.ReactNode;
  /** `fullscreen`: página inteira com a marca (fora do app); `inline`: dentro do shell autenticado. */
  variant?: "fullscreen" | "inline";
  tone?: "neutral" | "danger";
  logoUrl?: string | null;
  clinicName?: string;
  crmName?: string;
}

/** Página de status (404, erro) com ilustração nas cores do IDC. */
export function StatusPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  details,
  variant = "inline",
  tone = "neutral",
  logoUrl,
  clinicName,
  crmName,
  className,
  ...props
}: StatusPageProps) {
  const danger = tone === "danger";
  const fullscreen = variant === "fullscreen";

  const body = (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <StatusIllustration icon={Icon} danger={danger} />
      <div className="space-y-2">
        {eyebrow ? (
          <p
            className={cn(
              "text-xs font-semibold tracking-[0.2em] uppercase tabular-nums",
              danger ? "text-destructive" : "text-primary",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <div className="text-muted-foreground text-sm text-pretty">{description}</div> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col-reverse items-stretch justify-center gap-2 sm:w-auto sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
      {details ? <div className="text-muted-foreground/80 text-xs">{details}</div> : null}
    </div>
  );

  if (!fullscreen) {
    return (
      <div
        data-slot="status-page"
        className={cn("flex min-h-[60svh] items-center justify-center px-2 py-12", className)}
        {...props}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      data-slot="status-page"
      className={cn("relative isolate flex min-h-svh flex-col items-center justify-center gap-10 px-4 py-12", className)}
      {...props}
    >
      <BrandBackdrop />
      <BrandLogo logoUrl={logoUrl} clinicName={clinicName} crmName={crmName} layout="inline" />
      <main className="bg-card/90 ring-border/70 flex w-full max-w-lg justify-center rounded-2xl px-6 py-10 shadow-[0_18px_50px_-24px_rgb(13_110_110/0.35)] ring-1 backdrop-blur-sm sm:px-10">
        {body}
      </main>
    </div>
  );
}

function StatusIllustration({ icon: Icon, danger }: { icon: LucideIcon; danger: boolean }) {
  return (
    <div aria-hidden="true" className="relative size-28">
      <div className={cn("absolute inset-0 rounded-full", danger ? "bg-destructive/5" : "bg-primary/5")} />
      <div className={cn("absolute inset-3 rounded-full", danger ? "bg-destructive/10" : "bg-primary/10")} />
      <div
        className={cn(
          "bg-card absolute inset-7 flex items-center justify-center rounded-2xl border shadow-md",
          danger ? "border-destructive/20" : "border-primary/20",
        )}
      >
        <Icon className={cn("size-7", danger ? "text-destructive" : "text-primary")} strokeWidth={1.75} />
      </div>
      <span className="bg-gold absolute top-2 right-3 size-2.5 rounded-full" />
      <span className="bg-gold/60 absolute bottom-4 left-1 size-1.5 rounded-full" />
      <span className={cn("absolute top-6 left-0 size-2 rounded-full", danger ? "bg-destructive/30" : "bg-primary/30")} />
    </div>
  );
}
