"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FIELD_MAX_LENGTH,
  NONE_OPTION,
  formatMoneyInput,
  type LeadFormOutput,
  type LeadFormValues,
} from "@/features/leads/lib/form-schema";
import { useProfiles } from "@/features/settings/api/app-settings";
import { SERVICES } from "@/lib/constants";
import type { Profile } from "@/types/database";

/** Serviço de interesse, detalhe, valor estimado e responsável. */
export function ServiceFields() {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="service"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Serviço de interesse</FormLabel>
            <Select value={field.value || NONE_OPTION} onValueChange={field.onChange} name={field.name}>
              <FormControl>
                <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE_OPTION}>Não informado</SelectItem>
                <SelectSeparator />
                {SERVICES.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_detail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detalhe do serviço</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                maxLength={FIELD_MAX_LENGTH.service_detail}
                placeholder="Ex.: dor no dente 36"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="estimated_value"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor estimado</FormLabel>
            <div className="relative">
              <span
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm"
              >
                R$
              </span>
              <FormControl>
                <Input
                  {...field}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  className="pl-9 tabular-nums"
                  onChange={(event) => field.onChange(event.target.value.replace(/[^\d.,]/g, ""))}
                  onBlur={() => {
                    field.onChange(formatMoneyInput(field.value));
                    field.onBlur();
                  }}
                />
              </FormControl>
            </div>
            <FormDescription>Opcional — valor aproximado do procedimento.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <AssigneeField />
    </div>
  );
}

/** Responsável (assigned_to): usuários ativos + o responsável atual, mesmo se desativado. */
function AssigneeField() {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();
  const assigned = useWatch({ control: form.control, name: "assigned_to" });
  const profiles = useProfiles();
  const options = React.useMemo(() => assigneeOptions(profiles.data ?? [], assigned), [profiles.data, assigned]);
  const loadingProfiles = profiles.isPending;

  return (
    <FormField
      control={form.control}
      name="assigned_to"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Responsável</FormLabel>
          <Select value={field.value || NONE_OPTION} onValueChange={field.onChange} name={field.name}>
            <FormControl>
              <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full" disabled={loadingProfiles}>
                <SelectValue placeholder={loadingProfiles ? "Carregando usuários…" : "Selecione"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE_OPTION}>Sem responsável</SelectItem>
              {options.length > 0 ? <SelectSeparator /> : null}
              {options.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name}
                  {profile.active ? null : <span className="text-muted-foreground text-xs">(desativado)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {profiles.isError ? (
            <FormDescription className="text-destructive">Não foi possível carregar a lista de usuários.</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function assigneeOptions(profiles: readonly Profile[], assignedId: string): Profile[] {
  return profiles.filter((profile) => profile.active || profile.id === assignedId);
}

/** Notas livres sobre o lead (spec §4.3). */
export function NotesField() {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();
  const notes = useWatch({ control: form.control, name: "notes" }) ?? "";

  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notas</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              rows={4}
              maxLength={FIELD_MAX_LENGTH.notes}
              placeholder="Ex.: prefere atendimento pela manhã; já fez tratamento de canal em outra clínica…"
              className="min-h-24"
            />
          </FormControl>
          <FormDescription className="flex justify-end text-xs tabular-nums">
            {notes.length}/{FIELD_MAX_LENGTH.notes}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
