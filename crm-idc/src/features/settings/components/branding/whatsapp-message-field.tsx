"use client";

import * as React from "react";
import { BracesIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  NAME_PLACEHOLDER,
  WHATSAPP_MESSAGE_MAX,
  hasNamePlaceholder,
  insertAtSelection,
  unknownPlaceholders,
  type BrandingValues,
} from "../../lib/branding";

export interface WhatsappMessageFieldProps {
  control: Control<BrandingValues>;
  setValue: UseFormSetValue<BrandingValues>;
  disabled?: boolean;
}

/** Mensagem padrão dos botões de WhatsApp: {nome} vira o primeiro nome do lead. */
export function WhatsappMessageField({ control, setValue, disabled }: WhatsappMessageFieldProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  return (
    <FormField
      control={control}
      name="whatsapp_message"
      render={({ field }) => {
        const unknown = unknownPlaceholders(field.value);
        const length = field.value.length;

        const insertName = () => {
          const el = textareaRef.current;
          const { value, caret } = insertAtSelection(field.value, el?.selectionStart, el?.selectionEnd);
          setValue("whatsapp_message", value, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
          requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(caret, caret);
          });
        };

        return (
          <FormItem>
            <div className="flex items-end justify-between gap-2">
              <FormLabel>Mensagem padrão</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertName}
                disabled={disabled || length + NAME_PLACEHOLDER.length > WHATSAPP_MESSAGE_MAX}
                className="h-7 px-2 text-xs"
              >
                <BracesIcon aria-hidden="true" />
                Inserir {NAME_PLACEHOLDER}
              </Button>
            </div>
            <FormControl>
              <Textarea
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={(el) => {
                  field.ref(el);
                  textareaRef.current = el;
                }}
                rows={4}
                maxLength={WHATSAPP_MESSAGE_MAX}
                disabled={disabled}
                className="min-h-28 resize-y"
              />
            </FormControl>
            <div className="flex items-start justify-between gap-3">
              <FormDescription>
                Use <code className="bg-muted rounded px-1 py-0.5 text-xs">{NAME_PLACEHOLDER}</code> para o primeiro nome
                do lead. Sem nome cadastrado, o marcador é removido.
              </FormDescription>
              <span
                className={cn(
                  "text-muted-foreground shrink-0 pt-0.5 text-xs tabular-nums",
                  length > WHATSAPP_MESSAGE_MAX * 0.9 && "text-yellow-800",
                )}
                aria-label={`${length} de ${WHATSAPP_MESSAGE_MAX} caracteres`}
              >
                {formatNumber(length)}/{formatNumber(WHATSAPP_MESSAGE_MAX)}
              </span>
            </div>
            {unknown.length > 0 ? (
              <p role="status" className="bg-warning/15 flex items-start gap-1.5 rounded-md px-2.5 py-2 text-xs text-yellow-900">
                <TriangleAlertIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                <span>
                  {unknown.join(", ")} {unknown.length === 1 ? "não é substituído" : "não são substituídos"}{" "}
                  automaticamente — só {NAME_PLACEHOLDER} é suportado.
                </span>
              </p>
            ) : field.value.trim() && !hasNamePlaceholder(field.value) ? (
              <p role="status" className="text-muted-foreground bg-muted/60 flex items-start gap-1.5 rounded-md px-2.5 py-2 text-xs">
                <InfoIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                <span>Sem {NAME_PLACEHOLDER}, todos os leads recebem exatamente o mesmo texto.</span>
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
