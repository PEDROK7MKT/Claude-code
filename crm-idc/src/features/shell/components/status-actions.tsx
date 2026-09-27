"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, LayoutDashboardIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DASHBOARD_PATH } from "@/features/auth/lib/redirect";

/** "Voltar ao dashboard" (link primário ou secundário). */
export function DashboardLinkButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  return (
    <Button asChild variant={variant}>
      <Link href={DASHBOARD_PATH}>
        <LayoutDashboardIcon aria-hidden="true" />
        Voltar ao dashboard
      </Link>
    </Button>
  );
}

/** Volta à página anterior; sem histórico, vai para o dashboard. */
export function GoBackButton({ variant = "outline" }: { variant?: "default" | "outline" | "ghost" }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(DASHBOARD_PATH);
      }}
    >
      <ArrowLeftIcon aria-hidden="true" />
      Página anterior
    </Button>
  );
}

/** "Tentar novamente" com indicador enquanto a rota é recarregada. */
export function RetryButton({ onRetry, variant = "default" }: { onRetry: () => void; variant?: "default" | "outline" }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button type="button" variant={variant} disabled={pending} onClick={() => startTransition(onRetry)}>
      <RefreshCwIcon aria-hidden="true" className={pending ? "animate-spin" : undefined} />
      {pending ? "Tentando…" : "Tentar novamente"}
    </Button>
  );
}
