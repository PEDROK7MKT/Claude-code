"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateLead } from "@/features/leads/api/leads-mutations";
import { toCreateLeadPayload } from "@/features/leads/lib/form-payload";
import { emptyLeadFormValues, type LeadFormOutput } from "@/features/leads/lib/form-schema";
import { leadDetailHref } from "@/features/leads/lib/list-display";
import type { Lead } from "@/types/database";

import { DuplicateLeadsDialog, type DuplicateAction } from "./duplicate-leads-dialog";
import { LeadForm, type LeadFormSubmitContext } from "./lead-form";

const LEADS_PATH = "/leads";

interface DuplicateReview {
  output: LeadFormOutput;
  duplicates: Lead[];
  /** remonta o diálogo a cada envio (seleção sugerida recalculada) */
  key: number;
}

/**
 * /leads/novo — cadastro manual (spec §4.3). O lead nasce sempre como "novo"
 * (regra 1, garantido pelo banco); telefone já cadastrado abre a escolha entre
 * abrir, vincular ou criar mesmo assim (regra 4). Depois de salvar, abre o detalhe.
 */
export function NewLeadView() {
  const router = useRouter();
  const create = useCreateLead();
  const initialValues = React.useMemo(() => emptyLeadFormValues(), []);
  const [review, setReview] = React.useState<DuplicateReview | null>(null);
  const [pendingAction, setPendingAction] = React.useState<DuplicateAction | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  const createLead = async (output: LeadFormOutput, parentLeadId: string | null) => {
    // useCreateLead mostra o toast "Lead cadastrado" (ou o erro)
    const lead = await create.mutateAsync(toCreateLeadPayload(output, parentLeadId));
    router.push(leadDetailHref(lead.id));
  };

  const handleSubmit = async (output: LeadFormOutput, { duplicates }: LeadFormSubmitContext) => {
    if (duplicates.length > 0) {
      setReview((current) => ({ output, duplicates, key: (current?.key ?? 0) + 1 }));
      return;
    }
    await createLead(output, null);
  };

  const resolveDuplicate = async (action: DuplicateAction, parentLeadId: string | null) => {
    if (!review) return;
    setPendingAction(action);
    try {
      await createLead(review.output, parentLeadId);
    } catch {
      // erro já exibido; o diálogo continua aberto para tentar de novo
      setPendingAction(null);
    }
  };

  const leave = () => router.push(LEADS_PATH);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Novo lead"
        description="Cadastre um contato que chegou pelo WhatsApp ou por telefone. Campos com * são obrigatórios."
        breadcrumb={
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 w-fit">
            <Link href={LEADS_PATH}>
              <ArrowLeftIcon aria-hidden="true" />
              Voltar para leads
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <LeadForm
            mode="create"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => (dirty ? setConfirmLeave(true) : leave())}
            onDirtyChange={setDirty}
            // depois de criar, fica travado até a navegação para o detalhe
            busy={create.isPending || create.isSuccess}
          />
        </CardContent>
      </Card>

      {review ? (
        <DuplicateLeadsDialog
          key={review.key}
          open
          onOpenChange={(open) => {
            if (!open) setReview(null);
          }}
          duplicates={review.duplicates}
          leadName={review.output.name}
          phone={review.output.phone}
          pending={pendingAction}
          onOpenExisting={(lead) => router.push(leadDetailHref(lead.id))}
          onLink={(lead) => void resolveDuplicate("link", lead.id)}
          onCreateAnyway={() => void resolveDuplicate("create", null)}
        />
      ) : null}

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Descartar cadastro?"
        description="Os dados digitados neste formulário serão perdidos."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={leave}
      />
    </div>
  );
}
