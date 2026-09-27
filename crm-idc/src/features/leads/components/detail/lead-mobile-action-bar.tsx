"use client";

import * as React from "react";

import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { LeadQuickActions } from "@/features/leads/components/status";
import type { Lead } from "@/types/database";

export interface LeadMobileActionBarProps {
  lead: Lead;
  whatsappMessage?: string;
}

/** Celular: barra fixa no rodapé com WhatsApp e "Alterar status" sempre à mão. */
export function LeadMobileActionBar({ lead, whatsappMessage }: LeadMobileActionBarProps) {
  return (
    <div
      role="region"
      aria-label="Ações do lead"
      className="bg-card/95 supports-[backdrop-filter]:bg-card/85 fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <WhatsAppButton phone={lead.phone} name={lead.name} message={whatsappMessage} className="w-full" />
        <LeadQuickActions lead={lead} layout="menu" align="end" className="w-full" />
      </div>
    </div>
  );
}
