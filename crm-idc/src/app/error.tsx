"use client"; // error boundaries precisam ser Client Components

import { RouteError, type RouteErrorProps } from "@/features/shell/components/route-error";

/** Erros fora do shell autenticado (login, layout do app, rotas raiz). */
export default function RootError({ error, retry }: Pick<RouteErrorProps, "error" | "retry">) {
  return <RouteError error={error} retry={retry} variant="fullscreen" />;
}
