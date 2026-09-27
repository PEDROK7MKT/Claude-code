import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard } from "./auth-shell";

/** Esqueleto do card de login (loading.tsx de /login). */
export function LoginSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="w-full">
      <span className="sr-only">Carregando…</span>
      <AuthCard>
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-14 rounded-2xl" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 max-w-full" />
        </div>
        <div className="grid gap-5">
          {["email", "senha"].map((field) => (
            <div key={field} className="grid gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full" />
          <Skeleton className="mx-auto h-3 w-56 max-w-full" />
        </div>
      </AuthCard>
    </div>
  );
}
