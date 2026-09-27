"use client";

import * as React from "react";
import { MessageCircleIcon } from "lucide-react";

import { firstName, formatPhone, whatsappUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PhoneLinkProps extends Omit<React.ComponentProps<"a">, "href" | "children" | "target"> {
  phone: string | null | undefined;
  /** Nome do lead — preenche {nome} na mensagem e o rótulo acessível. */
  name?: string | null;
  /** Modelo da mensagem (aceita {nome}); padrão: DEFAULT_WHATSAPP_MESSAGE. */
  message?: string;
  /** Mostra o ícone do WhatsApp antes do número (padrão true). */
  showIcon?: boolean;
}

/** Telefone formatado e clicável → abre o WhatsApp (spec §4.3). */
export function PhoneLink({
  phone,
  name,
  message,
  showIcon = true,
  className,
  onClick,
  onPointerDown,
  ...props
}: PhoneLinkProps) {
  if (!phone) return <span className={cn("text-muted-foreground", className)}>—</span>;

  const formatted = formatPhone(phone);
  const who = firstName(name);

  return (
    <a
      href={whatsappUrl(phone, name, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${formatted} — abrir WhatsApp${who ? ` de ${who}` : ""}`}
      title="Abrir no WhatsApp"
      className={cn(
        "text-foreground inline-flex items-center gap-1.5 rounded-sm whitespace-nowrap tabular-nums underline-offset-4 transition-colors outline-none hover:text-green-700 hover:underline focus-visible:ring-[3px] focus-visible:ring-green-600/30",
        className,
      )}
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
      {showIcon ? <MessageCircleIcon aria-hidden="true" className="size-3.5 shrink-0 text-green-600" /> : null}
      {formatted}
    </a>
  );
}
