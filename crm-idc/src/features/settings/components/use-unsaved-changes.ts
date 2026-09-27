"use client";

import * as React from "react";

/**
 * Enquanto houver alterações não salvas: pede confirmação ao fechar/recarregar a
 * aba do navegador e avisa o componente pai (indicador na aba de Configurações).
 */
export function useUnsavedChanges(dirty: boolean, onDirtyChange?: (dirty: boolean) => void) {
  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // ao desmontar, a aba deixa de ter alterações pendentes
  React.useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  React.useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // navegadores antigos exigem returnValue
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
