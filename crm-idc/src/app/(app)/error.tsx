"use client"; // error boundaries precisam ser Client Components

import { RouteError, type RouteErrorProps } from "@/features/shell/components/route-error";

/** Erros das páginas autenticadas: exibidos dentro do shell (sidebar e header continuam). */
export default function AppError({ error, retry }: Pick<RouteErrorProps, "error" | "retry">) {
  return <RouteError error={error} retry={retry} variant="inline" />;
}
