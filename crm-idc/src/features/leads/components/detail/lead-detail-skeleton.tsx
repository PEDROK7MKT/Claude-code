import * as React from "react";

import { FormSkeleton, PageHeaderSkeleton } from "@/components/shared/loading-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Carregamento do detalhe do lead (loading.tsx e primeira consulta), no mesmo
 * layout da página. Só o FormSkeleton é região de status (um único anúncio).
 */
export function LeadDetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Card>
        <CardContent className="grid gap-4">
          <PageHeaderSkeleton announce={false} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-5 w-3/4" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)]">
        <div className="grid min-w-0 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-9 w-36" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 sm:flex-col">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
          <FormSkeleton fields={8} />
        </div>
        <div className="grid min-w-0 gap-6">
          {Array.from({ length: 2 }, (_, card) => (
            <Card key={card}>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="grid gap-4">
                {Array.from({ length: 3 }, (_, row) => (
                  <div key={row} className="flex gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <div className="grid flex-1 gap-2">
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
