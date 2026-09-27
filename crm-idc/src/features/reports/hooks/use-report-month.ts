"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { MONTH_PARAM, isMonthKey, parseMonthParam } from "../lib/month";

/**
 * Mês do relatório guardado na URL (?mes=yyyy-MM). Trocar de mês usa
 * history.pushState — o Next sincroniza com useSearchParams sem ida ao servidor
 * (funciona offline) e o botão "voltar" retorna ao mês anterior.
 */
export function useReportMonth(currentMonth: string): [string, (monthKey: string) => void] {
  const searchParams = useSearchParams();
  const raw = searchParams.get(MONTH_PARAM);
  const monthKey = parseMonthParam(raw, currentMonth) ?? currentMonth;

  const setMonth = React.useCallback(
    (next: string) => {
      if (!isMonthKey(next) || next > currentMonth) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set(MONTH_PARAM, next);
      window.history.pushState(null, "", `?${params.toString()}`);
    },
    [currentMonth, searchParams],
  );

  return [monthKey, setMonth];
}
