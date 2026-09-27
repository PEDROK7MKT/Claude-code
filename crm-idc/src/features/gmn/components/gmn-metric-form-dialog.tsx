"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useForm, useWatch, type Control } from "react-hook-form";

import { DateRangePicker } from "@/components/shared/date-time-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSaveGmnMetric, type GmnMetricInput } from "@/features/gmn/api/gmn-metrics";
import { todayKey } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import type { GmnMetric } from "@/types/database";
import {
  GMN_FIELD_META,
  emptyGmnFormValues,
  formValuesToInput,
  gmnFormSchema,
  metricToFormValues,
  parseCounterInput,
  suggestNewReviews,
  type GmnCounterField,
  type GmnFormValues,
} from "../lib/gmn-form";
import {
  PERIOD_PRESETS,
  detectPreset,
  findExactPeriod,
  findOverlappingPeriods,
  findPreviousRow,
  formatPeriod,
  formatPeriodShort,
  presetRange,
  suggestDefaultPeriod,
  type PeriodPreset,
} from "../lib/periods";

export interface GmnMetricFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Registro em edição (null = novo período) */
  metric: GmnMetric | null;
  /** Registros existentes — sobreposição e sugestão de avaliações novas */
  rows: readonly GmnMetric[];
  /** Troca o formulário para a edição de um registro existente (mesmo período) */
  onEditExisting: (metric: GmnMetric) => void;
}

/** Diálogo (admin) para registrar ou editar um período do GMN. */
export function GmnMetricFormDialog({ open, onOpenChange, metric, rows, onEditExisting }: GmnMetricFormDialogProps) {
  const save = useSaveGmnMetric();

  const handleOpenChange = (next: boolean) => {
    // não fecha enquanto salva
    if (!next && save.isPending) return;
    onOpenChange(next);
  };

  const submit = async (input: GmnMetricInput) => {
    await save.mutateAsync(input);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{metric ? "Editar período" : "Registrar período"}</DialogTitle>
          <DialogDescription>
            Copie os números do painel do Google Business Profile (Desempenho) para o período escolhido.
          </DialogDescription>
        </DialogHeader>
        {/* key: remonta o formulário ao trocar de registro */}
        <GmnMetricForm
          key={metric?.id ?? "novo"}
          metric={metric}
          rows={rows}
          saving={save.isPending}
          onSubmit={submit}
          onCancel={() => handleOpenChange(false)}
          onEditExisting={onEditExisting}
        />
      </DialogContent>
    </Dialog>
  );
}

interface GmnMetricFormProps {
  metric: GmnMetric | null;
  rows: readonly GmnMetric[];
  saving: boolean;
  onSubmit: (input: GmnMetricInput) => Promise<void>;
  onCancel: () => void;
  onEditExisting: (metric: GmnMetric) => void;
}

function isPeriodPreset(value: string): value is PeriodPreset {
  return PERIOD_PRESETS.some((p) => p.value === value);
}

function GmnMetricForm({ metric, rows, saving, onSubmit, onCancel, onEditExisting }: GmnMetricFormProps) {
  // "hoje" fixo enquanto o formulário está aberto (atalhos e data máxima)
  const [now] = React.useState(() => Date.now());
  const [defaultValues] = React.useState<GmnFormValues>(() =>
    metric ? metricToFormValues(metric) : emptyGmnFormValues(suggestDefaultPeriod(rows, now)),
  );
  const [preset, setPreset] = React.useState<PeriodPreset | null>(() => detectPreset(defaultValues.period, now));
  const pickerRef = React.useRef<HTMLButtonElement | null>(null);

  const form = useForm<GmnFormValues>({
    resolver: zodResolver(gmnFormSchema),
    defaultValues,
    mode: "onTouched",
  });
  const control = form.control;
  const period = useWatch({ control, name: "period" });
  const totalReviewsText = useWatch({ control, name: "total_reviews" });

  const excludeId = metric?.id ?? null;
  const exact = period ? findExactPeriod(period, rows, excludeId) : null;
  const overlaps = period ? findOverlappingPeriods(period, rows, excludeId) : [];
  const previousRow = period ? findPreviousRow(period, rows, excludeId) : null;
  const suggestion = suggestNewReviews(parseCounterInput(totalReviewsText), previousRow?.total_reviews);

  const choosePreset = (value: string) => {
    // ToggleGroup envia "" ao desmarcar o item ativo: mantém a seleção
    if (!isPeriodPreset(value)) return;
    setPreset(value);
    if (value === "custom") {
      // abre o calendário para escolher o intervalo
      pickerRef.current?.click();
      return;
    }
    form.setValue("period", presetRange(value, now), { shouldDirty: true, shouldValidate: true, shouldTouch: true });
  };

  const handleSubmit = async (values: GmnFormValues) => {
    try {
      await onSubmit(formValuesToInput(values, metric?.id));
    } catch {
      // o hook já exibiu o toast de erro; o formulário continua aberto para correção
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-6">
        <FormField
          control={control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período</FormLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={preset ?? ""}
                onValueChange={choosePreset}
                aria-label="Atalhos de período"
                className="w-full sm:w-fit"
              >
                {PERIOD_PRESETS.map((p) => (
                  <ToggleGroupItem key={p.value} value={p.value} className="px-1.5 text-xs sm:px-3 sm:text-sm">
                    {p.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FormControl>
                <DateRangePicker
                  ref={(el) => {
                    field.ref(el);
                    pickerRef.current = el;
                  }}
                  name={field.name}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={(range) => {
                    field.onChange(range);
                    setPreset(detectPreset(range, now));
                  }}
                  maxDate={todayKey(now)}
                  placeholder="Selecione a data inicial e a final"
                />
              </FormControl>
              <FormDescription>Use o mesmo intervalo selecionado no painel do Google.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {exact ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Este período já foi registrado</AlertTitle>
            <AlertDescription className="text-amber-900/80">
              <p>
                Já existe um registro de {formatPeriod(exact.period_start, exact.period_end)}. Edite-o para não duplicar os
                números.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => onEditExisting(exact)}>
                Editar registro existente
              </Button>
            </AlertDescription>
          </Alert>
        ) : overlaps.length > 0 ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Período sobreposto</AlertTitle>
            <AlertDescription className="text-amber-900/80">
              <p>
                Este período se sobrepõe a{" "}
                {overlaps.map((row) => formatPeriodShort(row.period_start, row.period_end)).join(", ")}. Os números podem
                ficar duplicados nos gráficos e comparativos.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup legend="Visibilidade">
          <CounterField control={control} name="search_views" />
          <CounterField control={control} name="maps_views" />
        </FieldGroup>

        <FieldGroup legend="Ações dos clientes" columns={3}>
          <CounterField control={control} name="website_clicks" />
          <CounterField control={control} name="direction_requests" />
          <CounterField control={control} name="phone_calls" />
        </FieldGroup>

        <FieldGroup legend="Avaliações" columns={3}>
          <CounterField control={control} name="total_reviews" />
          <FormField
            control={control}
            name="average_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{GMN_FIELD_META.average_rating.label}</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="decimal" autoComplete="off" placeholder="4,9" className="tabular-nums" />
                </FormControl>
                <FormDescription className="text-xs">De 0 a 5, uma casa decimal. Pode ficar em branco.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <CounterField
            control={control}
            name="new_reviews"
            description={
              suggestion != null && previousRow ? (
                <>
                  Registro anterior ({formatPeriodShort(previousRow.period_start, previousRow.period_end)}):{" "}
                  {formatNumber(previousRow.total_reviews)} avaliações.{" "}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      form.setValue("new_reviews", String(suggestion), {
                        shouldDirty: true,
                        shouldValidate: true,
                        shouldTouch: true,
                      })
                    }
                  >
                    Usar {formatNumber(suggestion)}
                  </Button>
                </>
              ) : undefined
            }
          />
        </FieldGroup>

        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Ex.: fotos novas publicadas, todas as avaliações respondidas, termos de pesquisa em alta…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
            {metric ? "Salvar alterações" : "Salvar período"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function FieldGroup({
  legend,
  columns = 2,
  children,
}: {
  legend: string;
  columns?: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="text-foreground mb-3 text-sm font-semibold">{legend}</legend>
      <div className={columns === 3 ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>{children}</div>
    </fieldset>
  );
}

function CounterField({
  control,
  name,
  description,
}: {
  control: Control<GmnFormValues>;
  name: GmnCounterField;
  description?: React.ReactNode;
}) {
  const meta = GMN_FIELD_META[name];
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{meta.label}</FormLabel>
          <FormControl>
            <Input {...field} inputMode="numeric" autoComplete="off" placeholder="0" className="tabular-nums" />
          </FormControl>
          <FormDescription className="text-xs">{description ?? meta.hint}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
