import type { Metadata } from "next";

import { NotFoundView } from "@/features/shell/components/not-found-view";

export const metadata: Metadata = {
  title: "Não encontrado",
};

/** notFound() em páginas autenticadas (ex.: lead inexistente): exibido dentro do shell. */
export default function AppNotFound() {
  return <NotFoundView variant="inline" />;
}
