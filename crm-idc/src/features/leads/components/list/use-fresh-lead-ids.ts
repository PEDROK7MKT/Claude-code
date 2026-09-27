"use client";

import * as React from "react";

import { findFreshLeadIds } from "@/features/leads/lib/list-display";
import type { Lead } from "@/types/database";

interface FreshState {
  listKey: string;
  /** Ids da última versão real (não placeholder) desta página; null até chegar a primeira */
  ids: string[] | null;
  signature: string | null;
  fresh: ReadonlySet<string>;
}

const NONE: ReadonlySet<string> = new Set();

/**
 * Ids de leads que acabaram de aparecer na página exibida (ex.: lead novo via
 * Realtime) para um destaque rápido. Só compara versões da MESMA página/filtros:
 * trocar de página, filtro ou ordenação nunca destaca nada.
 *
 * @param listKey identifica página + filtros (a chave da consulta)
 * @param rows linhas reais da página — passe `undefined` enquanto houver placeholder
 * @param receivedAt quando os dados chegaram (`dataUpdatedAt` da consulta)
 */
export function useFreshLeadIds(
  listKey: string,
  rows: ReadonlyArray<Pick<Lead, "id" | "created_at">> | undefined,
  receivedAt: number,
): ReadonlySet<string> {
  const ids = rows?.map((row) => row.id) ?? null;
  const signature = ids ? ids.join(",") : null;
  const [state, setState] = React.useState<FreshState>({ listKey, ids, signature, fresh: NONE });

  if (state.listKey !== listKey) {
    // Outra página/filtro: nova base de comparação
    setState({ listKey, ids, signature, fresh: NONE });
    return NONE;
  }
  if (rows && ids && signature !== state.signature) {
    const freshIds = state.ids ? findFreshLeadIds(state.ids, rows, receivedAt) : [];
    const fresh = freshIds.length ? new Set(freshIds) : NONE;
    setState({ listKey, ids, signature, fresh });
    return fresh;
  }
  return state.fresh;
}

const FLASH_OPTIONS: KeyframeAnimationOptions = { duration: 2500, easing: "ease-out" };

/** Destaque dourado no fundo de uma linha de tabela, que some em ~2,5s (Web Animations API; sem CSS global). */
export function flashFreshRow(node: HTMLElement | null): void {
  if (!node || typeof node.animate !== "function") return;
  node.animate([{ backgroundColor: "rgb(232 185 49 / 0.30)" }, { backgroundColor: "rgb(232 185 49 / 0)" }], FLASH_OPTIONS);
}

/** Mesmo destaque para uma camada sobreposta (cards com fundo próprio): opacidade 1 → 0. */
export function flashFreshOverlay(node: HTMLElement | null): void {
  if (!node || typeof node.animate !== "function") return;
  node.animate([{ opacity: 1 }, { opacity: 0 }], { ...FLASH_OPTIONS, fill: "forwards" });
}
