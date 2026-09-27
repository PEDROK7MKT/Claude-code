import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Linhas de lista em esqueleto (agenda e fila de espera). */
export function ListSkeleton({ rows, label }: { rows: number; label: string }) {
  return (
    <div role="status" aria-busy="true" className="space-y-4 px-3 py-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn("h-4", i % 2 ? "w-1/2" : "w-2/3")} />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}
