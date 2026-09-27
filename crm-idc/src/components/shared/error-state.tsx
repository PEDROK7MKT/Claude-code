"use client";

import * as React from "react";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  title?: React.ReactNode;
  message?: React.ReactNode;
  /** Exibe o botão "Tentar novamente" (ex.: `() => query.refetch()`). */
  onRetry?: () => void;
  /** Mostra o botão em estado de carregamento (ex.: `query.isFetching`). */
  retrying?: boolean;
  /** `sm` para uso dentro de cards/gráficos. */
  size?: "default" | "sm";
}

export function ErrorState({
  title = "Não foi possível carregar os dados",
  message = "Verifique sua conexão com a internet e tente novamente.",
  onRetry,
  retrying = false,
  size = "default",
  className,
  children,
  ...props
}: ErrorStateProps) {
  const compact = size === "sm";

  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 px-4 py-6" : "gap-4 px-6 py-12",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn(
          "bg-destructive/10 ring-destructive/15 flex items-center justify-center rounded-full ring-8",
          compact ? "size-11" : "size-14",
        )}
      >
        <TriangleAlertIcon className={cn("text-destructive", compact ? "size-5" : "size-6")} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <h3 className={cn("text-foreground font-semibold text-balance", compact ? "text-sm" : "text-base")}>{title}</h3>
        {message ? (
          <p className={cn("text-muted-foreground text-pretty", compact ? "text-xs" : "text-sm")}>{message}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={onRetry} disabled={retrying}>
          <RefreshCwIcon aria-hidden="true" className={cn(retrying && "animate-spin")} />
          {retrying ? "Tentando..." : "Tentar novamente"}
        </Button>
      ) : null}
      {children}
    </div>
  );
}
