"use client";

import * as React from "react";

/**
 * Pede confirmação do navegador ao recarregar/fechar a aba com alterações não
 * salvas (navegação interna do app não passa por aqui).
 */
export function useUnsavedChangesGuard(active: boolean): void {
  React.useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // navegadores antigos exigem returnValue preenchido
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}
