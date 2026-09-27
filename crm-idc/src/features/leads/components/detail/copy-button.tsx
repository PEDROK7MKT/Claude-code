"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COPIED_FEEDBACK_MS = 1_500;

export interface CopyButtonProps {
  value: string;
  /** O que está sendo copiado (rótulo acessível: "Copiar utm_source") */
  label: string;
  className?: string;
}

/** Botão de copiar para a área de transferência, com confirmação visual. */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const text = copied ? "Copiado!" : `Copiar ${label}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={text}
          className={cn("text-muted-foreground hover:text-foreground size-7 shrink-0", className)}
          onClick={copy}
        >
          {copied ? <CheckIcon aria-hidden="true" className="text-primary" /> : <CopyIcon aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
