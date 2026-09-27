import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Esqueleto de Configurações: cabeçalho, abas e a lista de usuários (aba padrão). Sem código de cliente. */
export function SettingsPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <PageHeaderSkeleton withActions={false} />
      <div className="bg-muted grid h-9 w-full grid-cols-3 gap-1 rounded-lg p-[3px] sm:w-[27rem]">
        <Skeleton className="bg-card h-full rounded-md" />
        <Skeleton className="h-full rounded-md bg-transparent" />
        <Skeleton className="h-full rounded-md bg-transparent" />
      </div>
      <div className="bg-card space-y-4 rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-52 max-w-full" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <TableSkeleton rows={3} columns={5} />
      </div>
    </div>
  );
}
