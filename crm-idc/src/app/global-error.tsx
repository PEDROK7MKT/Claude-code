"use client"; // error boundaries precisam ser Client Components

import "./globals.css";

import { GlobalErrorView } from "@/features/shell/components/global-error-view";
import { inter } from "@/features/shell/fonts";

/**
 * Erro no layout raiz: substitui o documento inteiro, por isso declara o próprio
 * <html>/<body>, estilos e fonte (sem providers do app).
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-background text-foreground min-h-svh font-sans antialiased">
        <title>Erro · IDC CRM</title>
        <GlobalErrorView error={error} retry={retry} />
      </body>
    </html>
  );
}
