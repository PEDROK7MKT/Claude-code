"use client";

import { useFormContext } from "react-hook-form";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FIELD_MAX_LENGTH,
  maskLeadPhoneInput,
  type LeadFormOutput,
  type LeadFormValues,
} from "@/features/leads/lib/form-schema";

import { DuplicatePhoneNotice } from "./duplicate-phone-notice";
import type { PhoneDuplicates } from "./use-phone-duplicates";

export interface ContactFieldsProps {
  mode: "create" | "edit";
  duplicates: Pick<PhoneDuplicates, "duplicates" | "checking">;
  /** Mostra o aviso de telefone duplicado (edição: só quando o telefone foi alterado) */
  showDuplicates: boolean;
  autoFocus?: boolean;
}

/** Nome e telefone (com máscara e aviso de telefone já cadastrado — regra 4). */
export function ContactFields({ mode, duplicates, showDuplicates, autoFocus = false }: ContactFieldsProps) {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();
  // sem wrapper vazio no grid (evitaria um espaço extra)
  const noticeVisible = showDuplicates && (duplicates.checking || duplicates.duplicates.length > 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nome <RequiredMark />
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="name"
                autoCapitalize="words"
                autoFocus={autoFocus}
                maxLength={FIELD_MAX_LENGTH.name}
                placeholder="Nome do paciente"
                aria-required="true"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Telefone (WhatsApp) <RequiredMark />
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(77) 98765-4321"
                aria-required="true"
                className="tabular-nums"
                onChange={(event) => field.onChange(maskLeadPhoneInput(event.target.value))}
              />
            </FormControl>
            <FormDescription>Com DDD. Números com +55 são ajustados automaticamente.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {noticeVisible ? (
        <div className="sm:col-span-2">
          <DuplicatePhoneNotice
            mode={mode}
            duplicates={duplicates.duplicates}
            checking={duplicates.checking}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Asterisco dos campos obrigatórios (o leitor de tela ouve "obrigatório"). */
export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-destructive">
        *
      </span>
      <span className="sr-only">(obrigatório)</span>
    </>
  );
}
