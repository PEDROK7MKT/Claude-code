"use client";

import * as React from "react";
import { ArrowRightIcon, ChevronDownIcon, CircleHelpIcon, InfoIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Onde cada número aparece no painel do Google Business Profile → campo do CRM. */
const FIELD_MAP: ReadonlyArray<{ source: string; detail?: string; field: string }> = [
  {
    source: "Desempenho → Visualizações",
    detail: "Pesquisa Google (celular + computador)",
    field: "Visualizações na busca",
  },
  {
    source: "Desempenho → Visualizações",
    detail: "Google Maps (celular + computador)",
    field: "Visualizações no Maps",
  },
  { source: "Desempenho → Cliques no site", field: "Cliques no site" },
  { source: "Desempenho → Rotas", detail: "Solicitações de rota", field: "Solicitações de rota" },
  { source: "Desempenho → Ligações", detail: "Chamadas pelo perfil", field: "Ligações" },
  {
    source: "Desempenho → Pesquisas",
    detail: "Termos usados para encontrar a clínica",
    field: "Observações (opcional)",
  },
  { source: "Perfil → Avaliações", detail: "Número ao lado das estrelas", field: "Total de avaliações e Nota média" },
];

export interface GmnHelpCardProps {
  defaultOpen?: boolean;
  className?: string;
}

/** Guia recolhível "Como preencher" (entrada manual — Fase 1 da integração com o GMN). */
export function GmnHelpCard({ defaultOpen = false, className }: GmnHelpCardProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card className={cn("gap-0 py-0", className)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="hover:bg-muted/40 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl px-6 py-4 text-left outline-none focus-visible:ring-[3px]"
          >
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
            >
              <CircleHelpIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Como preencher</span>
              <span className="text-muted-foreground block text-xs">
                Onde encontrar cada número no painel do Google Business Profile
              </span>
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("text-muted-foreground size-4 shrink-0 transition-transform", open && "rotate-180")}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-5 border-t px-6 py-5 text-sm">
            <ol className="text-foreground/90 list-decimal space-y-2 pl-5 marker:text-primary marker:font-semibold">
              <li>
                Acesse <span className="font-medium">business.google.com</span> (ou pesquise “Instituto Décio Carrilho” no
                Google, logado na conta que gerencia o perfil) e abra <span className="font-medium">Desempenho</span>.
              </li>
              <li>
                No seletor de datas do Desempenho, escolha o <span className="font-medium">mesmo período</span> que vai
                registrar aqui — de preferência sempre semanas ou meses fechados, para os comparativos ficarem corretos.
              </li>
              <li>Copie cada número para o campo correspondente, conforme a tabela abaixo.</li>
              <li>
                Para as avaliações, abra o perfil da clínica no Google: o total e a nota aparecem ao lado das estrelas.
                “Avaliações novas” = total atual − total do período anterior (o formulário sugere o valor).
              </li>
            </ol>

            <div className="overflow-hidden rounded-lg border">
              <div
                aria-hidden="true"
                className="bg-muted/50 text-muted-foreground hidden grid-cols-[1fr_auto_1fr] gap-3 px-4 py-2 text-xs font-medium sm:grid"
              >
                <span>No painel do Google</span>
                <span className="w-4" />
                <span>Campo no CRM</span>
              </div>
              <dl className="divide-y">
                {FIELD_MAP.map((item) => (
                  <div
                    key={`${item.source}-${item.field}`}
                    className="grid gap-1 px-4 py-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3"
                  >
                    <dt>
                      <span className="font-medium">{item.source}</span>
                      {item.detail ? <span className="text-muted-foreground block text-xs">{item.detail}</span> : null}
                    </dt>
                    <ArrowRightIcon aria-hidden="true" className="text-muted-foreground hidden size-4 sm:block" />
                    <dd className="text-primary font-medium">
                      <span className="sr-only">Campo no CRM: </span>
                      {item.field}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <Alert role="note">
              <InfoIcon aria-hidden="true" />
              <AlertTitle>Integração automática: Fase 2</AlertTitle>
              <AlertDescription>
                <p>
                  A conexão com a API do Google Business Profile (login com a conta Google do IDC e importação automática de
                  métricas e avaliações) está prevista para a Fase 2. Por enquanto, os números são copiados manualmente.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
