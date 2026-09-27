"use client";

import * as React from "react";
import { CheckCheckIcon, CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatPhone, initials } from "@/lib/format";
import { SAMPLE_LEAD, whatsappPreview } from "../../lib/branding";
import { useCopyToClipboard } from "../use-copy-to-clipboard";

// cores da interface do WhatsApp (só nesta prévia)
const CHAT_BACKGROUND = "#EFEAE2";
const OUTGOING_BUBBLE = "#D9FDD3";
const READ_TICKS = "#53BDEB";

export interface WhatsappPreviewProps {
  template: string;
}

/** Como a mensagem chega ao lead (mesmo link wa.me dos botões de WhatsApp do CRM). */
export function WhatsappPreview({ template }: WhatsappPreviewProps) {
  const [withoutName, setWithoutName] = React.useState(false);
  const switchId = React.useId();
  const { copy, isCopied } = useCopyToClipboard();
  const preview = whatsappPreview(template, withoutName ? null : SAMPLE_LEAD.name);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Prévia para o lead</p>
        <div className="flex items-center gap-2">
          <Switch id={switchId} checked={withoutName} onCheckedChange={setWithoutName} />
          <Label htmlFor={switchId} className="text-muted-foreground text-xs font-normal">
            Lead sem nome
          </Label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: CHAT_BACKGROUND }}>
        <div className="flex items-center gap-2 border-b border-black/5 bg-white/70 px-3 py-2 text-xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#075E54] text-[11px] font-semibold text-white">
            {withoutName ? "?" : initials(SAMPLE_LEAD.name)}
          </span>
          <span className="font-medium text-[#111B21]">{withoutName ? formatPhone(SAMPLE_LEAD.phone) : SAMPLE_LEAD.name}</span>
        </div>
        <div className="flex min-h-24 justify-end p-3">
          <div
            className="relative max-w-[85%] rounded-lg rounded-tr-none px-3 pt-2 pb-5 text-sm text-[#111B21] shadow-sm"
            style={{ backgroundColor: OUTGOING_BUBBLE }}
          >
            <p className="whitespace-pre-wrap break-words" aria-live="polite">
              {preview.text || <span className="text-black/40 italic">Mensagem vazia</span>}
            </p>
            <span className="absolute right-2 bottom-1 flex items-center gap-1 text-[10px] text-black/45">
              09:41
              <CheckCheckIcon aria-hidden="true" className="size-3.5" style={{ color: READ_TICKS }} />
            </span>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 flex items-start gap-2 rounded-lg border p-2.5">
        <code className="text-muted-foreground min-w-0 flex-1 text-[11px] leading-relaxed break-all">{preview.url}</code>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Copiar link de exemplo"
          title="Copiar link"
          onClick={() => void copy(preview.url, { successMessage: "Link copiado" })}
        >
          {isCopied() ? <CheckIcon aria-hidden="true" className="text-success" /> : <CopyIcon aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
