"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";

import { DatePicker } from "@/components/shared/date-time-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertDailyMetric } from "@/features/google-ads/api/daily-metrics";
import { matchKnownCampaign } from "@/features/google-ads/lib/campaigns";
import { rowCpl } from "@/features/google-ads/lib/history";
import {
  OTHER_CAMPAIGN_OPTION,
  findMetricConflict,
  getMetricFormWarnings,
  metricFormDefaults,
  metricFormSchema,
  type MetricFormOutput,
  type MetricFormValues,
} from "@/features/google-ads/lib/metric-form";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DailyMetric } from "@/types/database";
import { NumberTextInput } from "./number-text-input";

interface MetricFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Linha em edição (null = novo lançamento) */
  metric: DailyMetric | null;
  /** Todas as métricas (para detectar dia/campanha já lançados) */
  allMetrics: readonly DailyMetric[];
  campaignOptions: readonly string[];
  todayKey: string;
}

/** Diálogo "Lançar dia" / "Editar lançamento" (somente admin). */
export function MetricFormDialog({
  open,
  onOpenChange,
  metric,
  allMetrics,
  campaignOptions,
  todayKey,
}: MetricFormDialogProps) {
  const upsert = useUpsertDailyMetric();
  // Novo formulário (valores iniciais limpos) a cada abertura
  const [session, setSession] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((s) => s + 1);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // não fecha enquanto salva
        if (!next && upsert.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{metric ? "Editar lançamento" : "Lançar dia"}</DialogTitle>
          <DialogDescription>
            {metric
              ? `Métricas do Google Ads de ${formatDateKey(metric.date)} – ${metric.campaign}.`
              : "Copie os números do dia no painel do Google Ads. Leads e agendamentos são contados automaticamente pelo CRM."}
          </DialogDescription>
        </DialogHeader>
        <MetricForm
          key={`${session}-${metric?.id ?? "novo"}`}
          metric={metric}
          allMetrics={allMetrics}
          campaignOptions={campaignOptions}
          todayKey={todayKey}
          upsert={upsert}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface MetricFormProps {
  metric: DailyMetric | null;
  allMetrics: readonly DailyMetric[];
  campaignOptions: readonly string[];
  todayKey: string;
  upsert: ReturnType<typeof useUpsertDailyMetric>;
  onDone: () => void;
}

function MetricForm({ metric, allMetrics, campaignOptions, todayKey, upsert, onDone }: MetricFormProps) {
  const form = useForm<MetricFormValues, unknown, MetricFormOutput>({
    resolver: zodResolver(metricFormSchema),
    defaultValues: metricFormDefaults(metric, { todayKey, campaignOptions }),
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control });

  const isOther = values.campaignOption === OTHER_CAMPAIGN_OPTION;
  const typedCampaign = isOther ? (values.campaignOther ?? "") : (values.campaignOption ?? "");
  const campaign = matchKnownCampaign(typedCampaign, campaignOptions);
  const conflict = findMetricConflict(allMetrics, { date: values.date ?? "", campaign }, metric?.id);
  // Editar para um dia/campanha que já tem outro lançamento violaria o índice único
  const blocked = metric !== null && conflict !== null;
  const warnings = getMetricFormWarnings({
    impressions: values.impressions ?? "",
    clicks: values.clicks ?? "",
    conversions: values.conversions ?? "",
  });

  const onSubmit = form.handleSubmit(async (output) => {
    const name = matchKnownCampaign(output.campaign, campaignOptions) ?? output.campaign;
    const existing = findMetricConflict(allMetrics, { date: output.date, campaign: name }, metric?.id);
    if (metric && existing) return;
    try {
      // novo lançamento de um dia já lançado: atualiza a linha existente
      await upsert.mutateAsync({ ...output, campaign: name, id: metric?.id ?? existing?.id });
      onDone();
    } catch {
      // o hook já mostrou o toast de erro; mantém o formulário para corrigir
    }
  });

  const pending = upsert.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={pending || undefined}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <DatePicker
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onChange={(key) => field.onChange(key ?? "")}
                    onBlur={field.onBlur}
                    maxDate={todayKey}
                    disabled={pending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="campaignOption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campanha</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={pending}>
                  <FormControl>
                    <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
                      <SelectValue placeholder="Selecione a campanha" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    {campaignOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={OTHER_CAMPAIGN_OPTION}>Outra…</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isOther ? (
          <FormField
            control={form.control}
            name="campaignOther"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da campanha</FormLabel>
                <FormControl>
                  <Input {...field} disabled={pending} autoFocus maxLength={120} placeholder="Ex.: IDC | Clareamento" />
                </FormControl>
                <FormDescription>Use o nome exato do Google Ads para cruzar com os leads do CRM.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="impressions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impressões</FormLabel>
                <FormControl>
                  <NumberTextInput kind="integer" placeholder="0" {...field} disabled={pending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clicks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliques</FormLabel>
                <FormControl>
                  <NumberTextInput kind="integer" placeholder="0" {...field} disabled={pending} />
                </FormControl>
                {warnings.clicks ? <FieldWarning>{warnings.clicks}</FieldWarning> : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo</FormLabel>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm"
                  >
                    R$
                  </span>
                  <FormControl>
                    <NumberTextInput kind="money" placeholder="0,00" className="pl-9" {...field} disabled={pending} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="conversions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conversões</FormLabel>
                <FormControl>
                  <NumberTextInput kind="decimal" placeholder="0" {...field} disabled={pending} />
                </FormControl>
                {warnings.conversions ? <FieldWarning>{warnings.conversions}</FieldWarning> : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {metric ? (
          <p className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-md px-3 py-2 text-xs">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Contados pelo CRM neste dia: {formatNumber(metric.leads_total)}{" "}
              {metric.leads_total === 1 ? "lead" : "leads"} · {formatNumber(metric.leads_agendados)}{" "}
              {metric.leads_agendados === 1 ? "agendado" : "agendados"} · CPL real {formatCurrency(rowCpl(metric))}
            </span>
          </p>
        ) : null}

        {conflict ? (
          <Alert variant={blocked ? "destructive" : "default"} role={blocked ? "alert" : "status"}>
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>
              {blocked ? "Já existe outro lançamento para este dia" : "Este dia já foi lançado"}
            </AlertTitle>
            <AlertDescription>
              {blocked
                ? `${formatDateKey(conflict.date)} – ${conflict.campaign} já tem métricas. Edite ou exclua aquele lançamento no histórico.`
                : `${formatDateKey(conflict.date)} – ${conflict.campaign} já tem ${formatCurrency(Number(conflict.cost))} de custo lançado. Salvar vai substituir os valores.`}
            </AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || blocked}>
            {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
            {metric ? "Salvar alterações" : conflict ? "Substituir lançamento" : "Salvar lançamento"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function FieldWarning({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-1.5 text-xs text-amber-700">
      <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
