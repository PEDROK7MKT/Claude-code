"use client";

import * as React from "react";

import { leadListReturnHref } from "@/features/leads/lib/list-params";

/** Último endereço da lista de leads nesta aba (sessionStorage). */
const STORAGE_KEY = "idc:leads-list-href";
const LEADS_PATH = "/leads";

/** Guarda o endereço atual da lista (busca, filtros, ordem e página) para o "Voltar para leads" do detalhe. */
export function rememberLeadListHref(href: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, href);
  } catch {
    // armazenamento indisponível (modo privado, bloqueado): o voltar cai em /leads
  }
}

function readLeadListHref(): string {
  try {
    return leadListReturnHref(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return LEADS_PATH;
  }
}

function subscribeNever(): () => void {
  return () => {};
}

/**
 * Destino do "Voltar para leads": a lista como a pessoa a deixou nesta aba.
 * No servidor e na hidratação é "/leads" (sem divergência); logo depois, o endereço guardado.
 */
export function useLeadListReturnHref(): string {
  return React.useSyncExternalStore(subscribeNever, readLeadListHref, () => LEADS_PATH);
}
