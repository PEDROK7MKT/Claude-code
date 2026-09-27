"use client";

import type * as React from "react";

/** Elementos que têm ação própria dentro de uma linha/card clicável. */
const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, summary, [role='button'], [role='menuitem'], [role='checkbox'], [data-row-click-ignore]";

/**
 * Decide o que fazer com um clique na linha: `null` (ignorar), `"same"` (abrir
 * aqui) ou `"new-tab"` (Ctrl/⌘/Shift ou botão do meio). Ignora cliques em
 * links/botões, eventos vindos de portais (menus e diálogos) e seleção de texto.
 */
export function rowClickIntent(event: React.MouseEvent<HTMLElement>): "same" | "new-tab" | null {
  if (event.defaultPrevented) return null;
  const target = event.target;
  if (!(target instanceof Element) || !event.currentTarget.contains(target)) return null;
  if (target.closest(INTERACTIVE_SELECTOR)) return null;
  if (window.getSelection()?.type === "Range") return null;
  if (event.button === 1 || event.metaKey || event.ctrlKey || event.shiftKey) return "new-tab";
  return event.button === 0 ? "same" : null;
}

export function openInNewTab(href: string): void {
  window.open(href, "_blank", "noopener,noreferrer");
}
