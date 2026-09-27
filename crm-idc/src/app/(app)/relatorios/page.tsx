import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ReportsView } from "@/features/reports/components/reports-view";
import { MONTH_PARAM, parseMonthParam } from "@/features/reports/lib/month";
import { getAppSettings } from "@/features/settings/api/server";
import { currentMonthKey, todayKey } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Relatórios",
};

/**
 * /relatorios — relatório mensal (spec §4.7), mês em ?mes=yyyy-MM (padrão: mês atual
 * no fuso da clínica). Parâmetro inválido ou mês futuro volta para /relatorios.
 */
export default async function RelatoriosPage({ searchParams }: PageProps<"/relatorios">) {
  const params = await searchParams;
  const currentMonth = currentMonthKey();
  const requested = params[MONTH_PARAM];
  if (requested !== undefined && parseMonthParam(requested, currentMonth) === null) redirect("/relatorios");

  const settings = await getAppSettings();
  return <ReportsView currentMonth={currentMonth} today={todayKey()} initialSettings={settings} />;
}
