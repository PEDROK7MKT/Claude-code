import type { LucideIcon } from "lucide-react";
import { EyeIcon, MessageSquarePlusIcon, MousePointerClickIcon, NavigationIcon, PhoneIcon } from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GmnMetric } from "@/types/database";
import { formatPeriod, formatPeriodShort } from "../lib/periods";
import type { GmnComparison, GmnKpiKey } from "../lib/summary";

const KPI_META: Record<GmnKpiKey, { title: string; icon: LucideIcon }> = {
  totalViews: { title: "Visualizações totais", icon: EyeIcon },
  websiteClicks: { title: "Cliques no site", icon: MousePointerClickIcon },
  directionRequests: { title: "Solicitações de rota", icon: NavigationIcon },
  phoneCalls: { title: "Ligações", icon: PhoneIcon },
  newReviews: { title: "Avaliações novas", icon: MessageSquarePlusIcon },
};

const ORDER: readonly GmnKpiKey[] = ["totalViews", "websiteClicks", "directionRequests", "phoneCalls", "newReviews"];

export interface GmnKpiCardsProps {
  comparison: GmnComparison<GmnMetric>;
  className?: string;
}

/** KPIs do último período vs o período anterior equivalente (mesma duração). */
export function GmnKpiCards({ comparison, className }: GmnKpiCardsProps) {
  const { latest, previous, kpis } = comparison;
  const changeLabel = previous
    ? `vs ${formatPeriodShort(previous.period_start, previous.period_end)}`
    : "vs período anterior";

  const hints: Partial<Record<GmnKpiKey, string>> = {
    totalViews: `Busca ${formatNumber(latest.search_views)} · Maps ${formatNumber(latest.maps_views)}`,
    newReviews: `Total: ${formatNumber(latest.total_reviews)} avaliações`,
  };

  return (
    <section aria-labelledby="gmn-kpis-title" className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="gmn-kpis-title" className="text-base font-semibold">
          Último período
        </h2>
        <p className="text-muted-foreground text-sm">
          {formatPeriod(latest.period_start, latest.period_end)}
          {previous
            ? ` · comparado a ${formatPeriod(previous.period_start, previous.period_end)}`
            : " · sem período anterior de mesma duração para comparar"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {ORDER.map((key) => {
          const meta = KPI_META[key];
          return (
            <KpiCard
              key={key}
              title={meta.title}
              icon={meta.icon}
              value={formatNumber(kpis[key].current)}
              hint={hints[key]}
              change={kpis[key].change}
              changeLabel={changeLabel}
            />
          );
        })}
      </div>
    </section>
  );
}
