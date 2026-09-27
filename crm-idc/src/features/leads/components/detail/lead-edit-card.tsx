"use client";

import * as React from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateLead } from "@/features/leads/api/leads-mutations";
import { LeadForm } from "@/features/leads/components/form/lead-form";
import { hasLeadChanges } from "@/features/leads/lib/form-diff";
import { toUpdateLeadChanges } from "@/features/leads/lib/form-payload";
import { leadToFormValues, type LeadFormOutput, type LeadFormValues } from "@/features/leads/lib/form-schema";
import type { Lead } from "@/types/database";

/**
 * "Dados do lead" — todos os campos editáveis (spec §4.3) com o mesmo formulário
 * do cadastro. Só os campos alterados são enviados; o status muda apenas pelas ações.
 */
export function LeadEditCard({ lead }: { lead: Lead }) {
  const update = useUpdateLead();
  const initialValues = React.useMemo(() => leadToFormValues(lead), [lead]);

  const handleSubmit = async (output: LeadFormOutput): Promise<LeadFormValues> => {
    const changes = toUpdateLeadChanges(lead, output);
    if (!hasLeadChanges(changes)) {
      toast.info("Nada mudou: os dados já estavam salvos.");
      return leadToFormValues(lead);
    }
    // useUpdateLead mostra "Lead atualizado" (ou o erro) e atualiza os caches
    const saved = await update.mutateAsync({ id: lead.id, changes });
    return leadToFormValues(saved);
  };

  return (
    <Card id="dados-do-lead" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>
          <h2>Dados do lead</h2>
        </CardTitle>
        <CardDescription>
          Todos os campos podem ser editados. O status muda somente pelas ações rápidas, para ficar registrado no
          histórico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LeadForm mode="edit" leadId={lead.id} initialValues={initialValues} onSubmit={handleSubmit} headingLevel="h3" />
      </CardContent>
    </Card>
  );
}
