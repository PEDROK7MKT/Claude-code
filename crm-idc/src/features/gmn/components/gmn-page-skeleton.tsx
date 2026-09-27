import {
  CardGridSkeleton,
  ChartSkeleton,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/shared/loading-skeletons";
import { cn } from "@/lib/utils";

/**
 * Esqueleto da página do GMN no mesmo layout do conteúdo real
 * (destaque + ranking, KPIs, gráficos, histórico). Sem código de cliente.
 */
export function GmnPageSkeleton({ withHeader = true, className }: { withHeader?: boolean; className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {withHeader ? <PageHeaderSkeleton /> : null}
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartSkeleton height={220} className="lg:col-span-2" />
        <TableSkeleton rows={6} columns={3} mobileCards={false} className="lg:col-span-3" />
      </div>
      <CardGridSkeleton count={5} className="lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5" />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton height={260} />
        <ChartSkeleton height={260} />
      </div>
      <TableSkeleton rows={5} columns={8} />
    </div>
  );
}
