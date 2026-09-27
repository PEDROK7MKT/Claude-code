"use client";

import * as React from "react";
import { HistoryIcon, LockIcon, WifiOffIcon } from "lucide-react";

import { useOnlineStatus } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { describeLastSync } from "./lib/last-sync";
import { useLastSyncedAt, useNow } from "./use-last-synced";

/**
 * Pílula do header "Offline — dados salvos" (some quando há conexão). Ao tocar,
 * mostra quando os dados foram sincronizados e o que fica bloqueado offline.
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const online = useOnlineStatus();
  if (online) return null;
  return <OfflinePill className={className} />;
}

function OfflinePill({ className }: { className?: string }) {
  const syncedAt = useLastSyncedAt();
  const now = useNow();
  const lastSync = describeLastSync(syncedAt, now);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          asChild
          variant="outline"
          className={cn(
            "h-8 cursor-pointer gap-1.5 border-amber-300 bg-amber-50 px-2.5 text-amber-900 hover:bg-amber-100",
            "data-[state=open]:bg-amber-100 [&>svg]:size-3.5",
            className,
          )}
        >
          <button
            type="button"
            aria-label={
              lastSync
                ? `Offline — dados salvos, sincronizados ${lastSync.relative}. Ver detalhes`
                : "Offline — dados salvos. Ver detalhes"
            }
          >
            <WifiOffIcon aria-hidden="true" />
            <span className="sm:hidden">Offline</span>
            <span className="hidden sm:inline">Offline — dados salvos</span>
          </button>
        </Badge>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <div className="flex items-start gap-3 p-4 pb-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <WifiOffIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">Você está offline</p>
            <p className="text-muted-foreground text-xs text-pretty">
              Mostrando os dados salvos neste aparelho. Eles se atualizam sozinhos quando a conexão voltar.
            </p>
          </div>
        </div>

        <div className="bg-muted/60 mx-4 flex items-start gap-2.5 rounded-md px-3 py-2.5 text-xs">
          <HistoryIcon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <dl>
            <dt className="text-muted-foreground">Última sincronização</dt>
            {lastSync && syncedAt ? (
              <dd className="font-medium tabular-nums">
                {lastSync.relative}
                <time dateTime={new Date(syncedAt).toISOString()} className="text-muted-foreground block font-normal">
                  {lastSync.absolute}
                </time>
              </dd>
            ) : (
              <dd className="font-medium">Nenhum dado salvo ainda neste aparelho</dd>
            )}
          </dl>
        </div>

        <p className="text-muted-foreground flex items-start gap-2.5 p-4 pt-3 text-xs text-pretty">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Cadastrar leads, mudar status e editar métricas ficam bloqueados até a conexão voltar — as regras do funil
            são validadas pelo servidor.
          </span>
        </p>
      </PopoverContent>
    </Popover>
  );
}
