"use client";

import * as React from "react";
import { toast } from "sonner";

/** Copia texto (API Clipboard, com fallback para navegadores/contextos sem HTTPS). */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // cai no fallback abaixo
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copiar para a área de transferência com toast e estado "copiado" temporário
 * (ícone de check no botão por 2 s).
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = React.useCallback(
    async (text: string, { key = "default", successMessage = "Copiado" }: { key?: string; successMessage?: string } = {}) => {
      const ok = await writeClipboard(text);
      if (!ok) {
        toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
        return false;
      }
      toast.success(successMessage);
      setCopiedKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedKey(null), resetAfterMs);
      return true;
    },
    [resetAfterMs],
  );

  const isCopied = React.useCallback((key = "default") => copiedKey === key, [copiedKey]);

  return { copy, isCopied };
}
