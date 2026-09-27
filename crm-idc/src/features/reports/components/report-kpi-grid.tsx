import {
  CalendarCheckIcon,
  ClipboardCheckIcon,
  MousePointerClickIcon,
  PercentIcon,
  ReceiptIcon,
  StarIcon,
  TargetIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
  WalletIcon,
  BadgeDollarSignIcon,
  type LucideIcon,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { cn } from "@/lib/utils";
import type { ReportKpi, ReportKpiId } from "../lib/kpis";

const ICONS: Record<ReportKpiId, LucideIcon> = {
  leads: UsersIcon,
  scheduled: CalendarCheckIcon,
  schedulingRate: PercentIcon,
  attended: UserCheckIcon,
  attendanceRate: ClipboardCheckIcon,
  investment: WalletIcon,
  costPerLead: ReceiptIcon,
  costPerScheduled: BadgeDollarSignIcon,
  costPerGoogleAdsLead: TargetIcon,
  clicks: MousePointerClickIcon,
  ctr: TrendingUpIcon,
  gmnRating: StarIcon,
};

const ADS_KPIS = new Set<ReportKpiId>([
  "investment",
  "costPerLead",
  "costPerScheduled",
  "costPerGoogleAdsLead",
  "clicks",
  "ctr",
]);

interface ReportKpiGridProps {
  kpis: readonly ReportKpi[];
  /** "vs fevereiro" */
  changeLabel: string;
  adsLoading?: boolean;
  gmnLoading?: boolean;
  className?: string;
}

/** Grade dos 12 KPIs do mês (1 → 2 → 3 → 4 colunas conforme a largura). */
export function ReportKpiGrid({ kpis, changeLabel, adsLoading = false, gmnLoading = false, className }: ReportKpiGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          title={kpi.label}
          icon={ICONS[kpi.id]}
          value={kpi.value}
          hint={kpi.hint}
          change={kpi.change}
          changeLabel={changeLabel}
          invertChange={kpi.invertChange}
          loading={(adsLoading && ADS_KPIS.has(kpi.id)) || (gmnLoading && kpi.id === "gmnRating")}
          variant={kpi.id === "leads" ? "highlight" : "default"}
          className="break-inside-avoid"
        />
      ))}
    </div>
  );
}
