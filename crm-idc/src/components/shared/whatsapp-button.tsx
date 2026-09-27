"use client";

import * as React from "react";
import { MessageCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { firstName, whatsappUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

const whatsappVariantClass = {
  solid: "bg-green-700 text-white shadow-xs hover:bg-green-800 focus-visible:ring-green-600/40",
  outline:
    "border border-green-600/40 bg-card text-green-700 shadow-xs hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-600/30",
  ghost: "text-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-600/30",
} as const;

export interface WhatsAppButtonProps
  extends Omit<React.ComponentProps<"a">, "href" | "children" | "target"> {
  phone: string;
  /** Nome do lead — preenche {nome} na mensagem e o rótulo acessível. */
  name?: string | null;
  /** Modelo da mensagem (aceita {nome}); padrão: DEFAULT_WHATSAPP_MESSAGE. */
  message?: string;
  size?: "default" | "sm" | "lg";
  variant?: keyof typeof whatsappVariantClass;
  /** Só o ícone (com tooltip e aria-label). */
  iconOnly?: boolean;
  /** Texto do botão (padrão "WhatsApp"). */
  label?: string;
}

/** Abre a conversa no WhatsApp (wa.me/55…) em nova aba, com mensagem pré-preenchida. */
export function WhatsAppButton({
  phone,
  name,
  message,
  size = "default",
  variant = "solid",
  iconOnly = false,
  label = "WhatsApp",
  className,
  onClick,
  onPointerDown,
  ...props
}: WhatsAppButtonProps) {
  const href = whatsappUrl(phone, name, message);
  const who = firstName(name);
  const accessibleLabel = who ? `Abrir conversa no WhatsApp com ${who}` : "Abrir conversa no WhatsApp";
  const buttonSize = iconOnly ? (size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon") : size;

  const link = (
    <Button asChild size={buttonSize} className={cn(whatsappVariantClass[variant], className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={iconOnly ? accessibleLabel : undefined}
        title={iconOnly ? undefined : accessibleLabel}
        // Não propaga para linhas clicáveis / cards arrastáveis do kanban.
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPointerDown?.(event);
        }}
        {...props}
      >
        <MessageCircleIcon aria-hidden="true" />
        {iconOnly ? null : label}
      </a>
    </Button>
  );

  if (!iconOnly) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent>{accessibleLabel}</TooltipContent>
    </Tooltip>
  );
}
