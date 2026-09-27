"use client";

import * as React from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, WandSparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PASSWORD_MAX_LENGTH, generatePassword, passwordStrength, type PasswordStrengthLevel } from "../../lib/password";
import { useCopyToClipboard } from "../use-copy-to-clipboard";

const STRENGTH_COLOR: Record<PasswordStrengthLevel, string> = {
  empty: "bg-muted-foreground/40",
  "too-short": "bg-destructive",
  weak: "bg-destructive",
  fair: "bg-warning",
  good: "bg-primary",
  strong: "bg-success",
};

type PasswordFieldProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Senha definida pelo admin: mostrar/ocultar, "Gerar senha" (forte, revelada
 * para o admin anotar), copiar e medidor de força. Props de acessibilidade
 * (id, aria-*) vão para o <input> — funciona dentro de <FormControl>.
 */
export function PasswordField({ value, onValueChange, className, disabled, id, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;
  const strengthId = `${inputId}-strength`;
  const strength = passwordStrength(value);
  const { copy, isCopied } = useCopyToClipboard();

  const generate = () => {
    onValueChange(generatePassword());
    // senha gerada fica visível para o admin conferir e repassar
    setVisible(true);
  };

  const describedBy = [inputProps["aria-describedby"], strengthId].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            {...inputProps}
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            disabled={disabled}
            maxLength={PASSWORD_MAX_LENGTH}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={describedBy}
            className={cn("pr-10 font-mono tracking-wide", className)}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            aria-controls={inputId}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
          >
            {visible ? <EyeOffIcon aria-hidden="true" className="size-4" /> : <EyeIcon aria-hidden="true" className="size-4" />}
          </button>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled || !value}
              aria-label="Copiar senha"
              onClick={() => void copy(value, { successMessage: "Senha copiada" })}
            >
              {isCopied() ? <CheckIcon aria-hidden="true" className="text-success" /> : <CopyIcon aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copiar senha</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1" id={strengthId} aria-live="polite">
          <Progress
            value={strength.score * 25}
            aria-label="Força da senha"
            className="bg-muted h-1.5"
            indicatorClassName={STRENGTH_COLOR[strength.level]}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {strength.label ? (
              <>
                Força: <span className="text-foreground font-medium">{strength.label}</span>
              </>
            ) : (
              "Mínimo de 8 caracteres"
            )}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={generate} disabled={disabled} className="shrink-0">
          <WandSparklesIcon aria-hidden="true" />
          Gerar senha
        </Button>
      </div>
    </div>
  );
}
