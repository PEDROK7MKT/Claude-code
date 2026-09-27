import { CardGridSkeleton, ChartSkeleton, PageHeaderSkeleton } from "@/components/shared/loading-skeletons";

/** Esqueleto da rota /dashboard (loading.tsx): cabeçalho, 5 KPIs e gráficos no layout do admin. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={5} className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 content-start gap-4 lg:grid-cols-2">
          <ChartSkeleton height={260} className="lg:col-span-2" />
          <ChartSkeleton height={220} />
          <ChartSkeleton height={220} />
        </div>
        <ChartSkeleton height={320} className="hidden xl:block" />
      </div>
    </div>
  );
}
