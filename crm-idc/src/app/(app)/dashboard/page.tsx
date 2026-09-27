import type { Metadata } from "next";

import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { DentistDashboard } from "@/features/dashboard/components/dentist-dashboard";
import { parsePeriodParam, PERIOD_PARAM } from "@/features/dashboard/lib/period";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * /dashboard — admin vê KPIs, gráficos e GMN (período em ?periodo=today|7d|30d|month,
 * padrão 30 dias); dentista vê o dashboard simplificado (spec §4.2).
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await requireSession();
  if (session.profile.role !== "admin") return <DentistDashboard />;

  const params = await searchParams;
  return <AdminDashboard initialPeriod={parsePeriodParam(params[PERIOD_PARAM])} />;
}
