"use client";

import { CircleCheckIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import type { Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BrandingValues } from "../../lib/branding";
import { formatContrastRatio, normalizeHexInput, type ColorAssessment } from "../../lib/color";

export interface ColorFieldProps {
  control: Control<BrandingValues>;
  name: "primary_color" | "accent_color";
  label: string;
  description: string;
  /** Cor padrão do IDC (botão "Padrão" e amostra enquanto o hex está incompleto) */
  defaultColor: string;
  assess: (hex: string) => ColorAssessment;
  disabled?: boolean;
}

/** Cor da marca: seletor nativo + campo hex (#RRGGBB) + aviso de contraste. */
export function ColorField({ control, name, label, description, defaultColor, assess, disabled }: ColorFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hex = normalizeHexInput(field.value);
        const assessment = hex ? assess(hex) : null;
        const setColor = (value: string) => field.onChange(value.toUpperCase());

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              {/* seletor nativo por cima da amostra (acessível pelo teclado) */}
              <span
                className="ring-border focus-within:ring-ring/50 relative size-9 shrink-0 overflow-hidden rounded-md shadow-xs ring-1 focus-within:ring-[3px]"
                style={{ backgroundColor: hex ?? defaultColor }}
              >
                <input
                  type="color"
                  value={(hex ?? defaultColor).toLowerCase()}
                  onChange={(event) => setColor(event.target.value)}
                  disabled={disabled}
                  aria-label={`Escolher ${label.toLowerCase()} na paleta`}
                  className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </span>
              <FormControl>
                <Input
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={() => {
                    // "0d6e6e" / "#0d6" → "#0D6E6E" ao sair do campo
                    const normalized = normalizeHexInput(field.value);
                    if (normalized && normalized !== field.value) field.onChange(normalized);
                    field.onBlur();
                  }}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder={defaultColor}
                  disabled={disabled}
                  className="w-28 font-mono uppercase"
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setColor(defaultColor);
                  field.onBlur();
                }}
                disabled={disabled || hex === defaultColor}
                className="text-muted-foreground"
              >
                <RotateCcwIcon aria-hidden="true" />
                Padrão
              </Button>
            </div>
            <FormDescription>{description}</FormDescription>
            {assessment && !fieldState.error ? <ContrastNote assessment={assessment} /> : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function ContrastNote({ assessment }: { assessment: ColorAssessment }) {
  const ok = !assessment.warning;
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-1.5 rounded-md px-2.5 py-2 text-xs leading-snug",
        ok ? "bg-success/10 text-green-800" : "bg-warning/15 text-yellow-900",
      )}
    >
      {ok ? (
        <CircleCheckIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      ) : (
        <TriangleAlertIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      )}
      <span>
        {ok
          ? `Boa legibilidade · contraste de ${formatContrastRatio(assessment.ratioOnWhite)} com o branco`
          : assessment.warning}
      </span>
    </p>
  );
}
