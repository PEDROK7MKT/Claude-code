"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, InfoIcon, Link2Icon, TriangleAlertIcon, WandSparklesIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadFormOutput, LeadFormValues } from "@/features/leads/lib/form-schema";
import {
  INVALID_URL_MESSAGE,
  buildUrlAutofill,
  describeUrlAutofill,
  looksLikeUrl,
  urlFieldLabel,
  type UrlAutofillResult,
  type UrlFilledField,
} from "@/features/leads/lib/form-url";
import { parseLeadUrl } from "@/lib/utm";
import { cn } from "@/lib/utils";

interface AutofillFeedback {
  tone: "success" | "info" | "error";
  message: string;
  filled: UrlFilledField[];
}

export interface UrlAutofillProps {
  /** Chamado depois de aplicar a URL (ex.: abrir a seção de UTMs). */
  onApplied?: (result: UrlAutofillResult) => void;
  defaultOpen?: boolean;
}

/**
 * Spec §6.1 — Opção B: colar a URL que o lead acessou preenche UTMs, palavra-chave,
 * página de destino, campanha e (se a fonte está vazia/"outro") a fonte sugerida.
 * Aplica ao colar, ao sair do campo, com Enter ou pelo botão.
 */
export function UrlAutofill({ onApplied, defaultOpen = false }: UrlAutofillProps) {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();
  const inputId = React.useId();
  const hintId = React.useId();
  const [open, setOpen] = React.useState(defaultOpen);
  const [url, setUrl] = React.useState("");
  const [feedback, setFeedback] = React.useState<AutofillFeedback | null>(null);
  const lastAppliedRef = React.useRef<string | null>(null);
  const pastedRef = React.useRef(false);

  const apply = (raw: string, { force = false }: { force?: boolean } = {}) => {
    const value = raw.trim();
    if (!value) {
      setFeedback(null);
      lastAppliedRef.current = null;
      return;
    }
    if (!force && value === lastAppliedRef.current) return;
    lastAppliedRef.current = value;

    if (!looksLikeUrl(value)) {
      setFeedback({ tone: "error", message: INVALID_URL_MESSAGE, filled: [] });
      return;
    }

    const result = buildUrlAutofill(form.getValues(), parseLeadUrl(value));
    for (const key of Object.keys(result.patch) as Array<keyof LeadFormValues>) {
      const next = result.patch[key];
      if (next !== undefined) form.setValue(key, next, { shouldDirty: true, shouldValidate: true });
    }

    const message = describeUrlAutofill(result);
    setFeedback({ tone: result.filled.length > 0 ? "success" : "info", message, filled: result.filled });
    if (result.filled.length > 0) toast.success("Dados da URL aplicados", { description: message });
    onApplied?.(result);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="bg-muted/40 rounded-lg border">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none focus-visible:ring-[3px]"
        >
          <Link2Icon aria-hidden="true" className="text-primary size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="text-foreground block font-medium">Colar URL de origem</span>
            <span className="text-muted-foreground block text-xs">
              Preenche campanha, palavra-chave, página e UTMs automaticamente
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn("text-muted-foreground size-4 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-2 px-3 pb-3">
        <Label htmlFor={inputId} className="sr-only">
          URL que o lead acessou
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={inputId}
            value={url}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://institutodeciocarrilho.com.br/urgencia?utm_source=google…"
            aria-describedby={hintId}
            className="font-mono text-xs sm:text-sm"
            onPaste={() => {
              pastedRef.current = true;
            }}
            onChange={(event) => {
              setUrl(event.target.value);
              if (pastedRef.current) {
                pastedRef.current = false;
                apply(event.target.value);
              }
            }}
            onBlur={() => apply(url)}
            onKeyDown={(event) => {
              // Enter aplica a URL em vez de enviar o formulário do lead
              if (event.key === "Enter") {
                event.preventDefault();
                apply(url, { force: true });
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={!url.trim()}
            onClick={() => apply(url, { force: true })}
          >
            <WandSparklesIcon aria-hidden="true" />
            Preencher campos
          </Button>
        </div>
        <p id={hintId} className="text-muted-foreground text-xs">
          Cole o link do anúncio ou da página em que o paciente clicou. A fonte só é trocada se estiver vazia ou como
          “Outro”.
        </p>
        <div role="status" aria-live="polite">
          {feedback ? <AutofillFeedbackMessage feedback={feedback} /> : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AutofillFeedbackMessage({ feedback }: { feedback: AutofillFeedback }) {
  const Icon = feedback.tone === "success" ? CheckIcon : feedback.tone === "error" ? TriangleAlertIcon : InfoIcon;
  return (
    <div
      className={cn(
        "grid gap-2 rounded-md border px-3 py-2 text-sm",
        feedback.tone === "success" && "border-primary/25 bg-primary/5 text-foreground",
        feedback.tone === "info" && "bg-card text-muted-foreground",
        feedback.tone === "error" && "border-destructive/30 bg-destructive/5 text-destructive",
      )}
    >
      <p className="flex items-start gap-2">
        <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", feedback.tone === "success" && "text-primary")} />
        <span>{feedback.message}</span>
      </p>
      {feedback.filled.length > 0 ? (
        <ul aria-label="Campos preenchidos" className="flex flex-wrap gap-1.5">
          {feedback.filled.map((field) => (
            <li
              key={field}
              className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              <CheckIcon aria-hidden="true" className="size-3" />
              {urlFieldLabel(field)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
