import * as React from "react";
import { DatabaseIcon, HistoryIcon, LockIcon, WifiOffIcon, type LucideIcon } from "lucide-react";

import { StatusPage } from "@/features/shell/components/status-page";
import { cn } from "@/lib/utils";
import { OfflineActions, OfflineAutoRetry } from "./offline-actions";

const OFFLINE_NOTES: ReadonlyArray<{ icon: LucideIcon; text: string; available: boolean }> = [
  { icon: HistoryIcon, text: "Páginas abertas recentemente continuam disponíveis neste aparelho.", available: true },
  { icon: DatabaseIcon, text: "Leads, kanban e métricas já carregados ficam salvos e aparecem sem internet.", available: true },
  {
    icon: LockIcon,
    text: "Cadastros e mudanças de status voltam a funcionar quando a conexão voltar.",
    available: false,
  },
];

/**
 * Página de fallback offline (servida pelo service worker quando uma página nunca
 * aberta não carrega). Marca fixa, sem dados nem imagens externas: precisa abrir
 * inteira a partir do cache.
 */
export function OfflineView() {
  return (
    <StatusPage
      variant="fullscreen"
      icon={WifiOffIcon}
      eyebrow="Sem conexão"
      title="Você está offline"
      description={
        <div className="space-y-5">
          <p>
            Não foi possível carregar esta página agora. Confira o Wi-Fi ou os dados móveis e tente novamente.
          </p>
          <ul className="bg-muted/50 space-y-3 rounded-xl p-4 text-left">
            {OFFLINE_NOTES.map(({ icon: Icon, text, available }) => (
              <li key={text} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    available ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="text-foreground/80 pt-1 leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      }
      actions={<OfflineActions />}
      details={<OfflineAutoRetry />}
    />
  );
}
