"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatNumberInput, type NumberKind } from "@/features/google-ads/lib/metric-form";
import { cn } from "@/lib/utils";

interface NumberTextInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  kind: NumberKind;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Campo numérico em formato brasileiro digitado como texto (aceita "1.234,56",
 * "1234.56", "R$ 10"). Ao sair do campo formata: inteiro "1.234", moeda "1.234,56".
 * Compatível com <FormControl> (id/aria-* repassados ao <input>).
 */
export function NumberTextInput({ kind, value, onChange, onBlur, className, ...props }: NumberTextInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode={kind === "integer" ? "numeric" : "decimal"}
      autoComplete="off"
      spellCheck={false}
      value={value}
      className={cn("tabular-nums", className)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => {
        const formatted = formatNumberInput(event.target.value, kind);
        if (formatted !== event.target.value) onChange(formatted);
        onBlur?.(event);
      }}
    />
  );
}
