import {
  CardGridSkeleton,
  ChartSkeleton,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/shared/loading-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Conteúdo do relatório carregando (KPIs, resumo, gráficos e tabela). Sem código de cliente. */
export function ReportsContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <Skeleton className="h-5 w-44" />
        <CardGridSkeleton count={12} className="lg:grid-cols-3 xl:grid-cols-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton height={260} className="lg:col-span-2" />
        <ChartSkeleton height={220} />
        <ChartSkeleton height={220} />
      </div>
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}

/** Página inteira para o loading.tsx: cabeçalho, barra de mês/exportação e conteúdo. */
export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withActions={false} announce={false} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          <Skeleton className="size-9" />
          <Skeleton className="h-9 flex-1 sm:w-52 sm:flex-none" />
          <Skeleton className="size-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Skeleton className="h-9 sm:w-36" />
          <Skeleton className="h-9 sm:w-36" />
        </div>
      </div>
      <ReportsContentSkeleton />
    </div>
  );
}
