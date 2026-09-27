"use client";

import * as React from "react";
import { CheckIcon, CopyIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { summaryToText } from "../lib/summary";

interface ReportSummaryCardProps {
  paragraphs: readonly string[];
  /** Métricas secundárias ainda carregando: mostra esqueleto para o texto não "pular" */
  loading?: boolean;
  monthLabel: string;
}

/** Resumo automático em texto corrido, com botão para copiar (ex.: enviar pelo WhatsApp). */
export function ReportSummaryCard({ paragraphs, loading = false, monthLabel }: ReportSummaryCardProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryToText(paragraphs));
      setCopied(true);
      toast.success("Resumo copiado", { description: "Cole no WhatsApp, e-mail ou onde preferir." });
    } catch {
      toast.error("Não foi possível copiar o resumo", {
        description: "Seu navegador bloqueou o acesso à área de transferência. Selecione o texto e copie manualmente.",
      });
    }
  };

  return (
    <Card className="border-primary/20 from-primary/[0.04] to-card gap-4 bg-gradient-to-br break-inside-avoid">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden="true" className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
            <SparklesIcon className="size-4" />
          </span>
          Resumo de {monthLabel}
        </CardTitle>
        <CardDescription>Texto gerado automaticamente a partir dos dados do CRM.</CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copy()}
            disabled={loading || paragraphs.length === 0}
            className="print:hidden"
          >
            {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent aria-live="polite" aria-busy={loading || undefined}>
        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <span className="sr-only">Gerando resumo…</span>
          </div>
        ) : (
          <div className="text-foreground/90 max-w-prose space-y-3 text-[15px] leading-relaxed text-pretty">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
