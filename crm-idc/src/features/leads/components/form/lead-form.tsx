"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardListIcon, Loader2Icon, NotebookPenIcon, SaveIcon, StethoscopeIcon, UserRoundIcon } from "lucide-react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { dirtyFieldLabels, dirtyFieldNames, sameFormValues } from "@/features/leads/lib/form-diff";
import { leadFormSchema, type LeadFormOutput, type LeadFormValues } from "@/features/leads/lib/form-schema";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";

import { ContactFields } from "./contact-fields";
import { FormSection } from "./form-section";
import { NotesField, ServiceFields } from "./service-fields";
import { TrackingFields } from "./tracking-fields";
import { usePhoneDuplicates } from "./use-phone-duplicates";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";

export interface LeadFormSubmitContext {
  /** Valores digitados (texto), para resetar/refazer o formulário */
  values: LeadFormValues;
  /** Cadastro: leads com o mesmo telefone, confirmados no envio (regra 4). Edição: sempre vazio. */
  duplicates: Lead[];
}

export interface LeadFormProps {
  /** create: cadastro (/leads/novo) · edit: "Dados do lead" no detalhe */
  mode: "create" | "edit";
  /** Valores iniciais. Na edição, mudanças vindas do servidor (Realtime) atualizam os campos não alterados. */
  initialValues: LeadFormValues;
  /** Edição: id do lead (fica fora da verificação de telefone duplicado). */
  leadId?: string | null;
  /**
   * Recebe os campos já no formato do banco. Na edição, devolva os valores salvos
   * (leadToFormValues do lead atualizado) para o formulário voltar ao estado "sem alterações".
   * Se rejeitar, o formulário continua como está (o erro é mostrado pela mutation).
   */
  onSubmit: (output: LeadFormOutput, context: LeadFormSubmitContext) => Promise<LeadFormValues | void>;
  /** Cadastro: botão "Cancelar". */
  onCancel?: () => void;
  /** Ação externa em andamento (ex.: diálogo de duplicados salvando) — trava o formulário. */
  busy?: boolean;
  /** Avisa o pai quando há alterações não salvas. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Títulos das seções: h2 (página de cadastro) ou h3 (dentro de um card). */
  headingLevel?: "h2" | "h3";
  className?: string;
}

/**
 * Formulário do lead (spec §4.3): cadastro e edição com os mesmos campos —
 * obrigatórios Nome, Telefone e Fonte; rastreamento do anúncio para Google Ads;
 * colar URL de origem (§6.1 Opção B); UTMs; serviço; valor; responsável; notas.
 * O status nunca é editado aqui (só pelas ações de status).
 */
export function LeadForm({
  mode,
  initialValues,
  leadId = null,
  onSubmit,
  onCancel,
  busy = false,
  onDirtyChange,
  headingLevel = "h2",
  className,
}: LeadFormProps) {
  const edit = mode === "edit";
  const form = useForm<LeadFormValues, unknown, LeadFormOutput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const { isDirty, isSubmitting, dirtyFields } = form.formState;
  const saving = isSubmitting || busy;

  const phone = useWatch({ control: form.control, name: "phone" });
  // Edição: só avisa quando o telefone foi trocado (o card "Contatos anteriores" já lista os demais).
  const checkPhone = !edit || Boolean(dirtyFields.phone);
  const phoneDuplicates = usePhoneDuplicates(phone, { excludeId: leadId, enabled: checkPhone });

  const appliedRef = useExternalValuesSync(form, initialValues, edit);

  useUnsavedChangesGuard(isDirty && !saving);
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submitValid = async (output: LeadFormOutput) => {
    const values = form.getValues();
    let duplicates: Lead[] = [];
    if (!edit) {
      try {
        duplicates = await phoneDuplicates.check(output.phone);
      } catch (error) {
        toast.error(getErrorMessage(error));
        return;
      }
    }
    try {
      const next = await onSubmit(output, { values, duplicates });
      if (next) {
        appliedRef.current = next;
        form.reset(next);
      }
    } catch {
      // erro já exibido pela mutation (toast); mantém o que foi digitado
    }
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => form.handleSubmit(submitValid)(event);

  const changedLabels = dirtyFieldLabels(dirtyFieldNames(dirtyFields));

  return (
    <Form {...form}>
      <form noValidate onSubmit={handleSubmit} aria-busy={saving || undefined} className={cn("grid gap-6", className)}>
        <fieldset disabled={saving} className="grid min-w-0 gap-6">
          <legend className="sr-only">{edit ? "Dados do lead" : "Cadastro de novo lead"}</legend>

          <FormSection title="Contato" icon={UserRoundIcon} headingLevel={headingLevel}>
            <ContactFields
              mode={mode}
              duplicates={phoneDuplicates}
              showDuplicates={checkPhone}
              autoFocus={!edit}
            />
          </FormSection>

          <Separator />

          <FormSection
            title="Origem"
            description="De onde o lead veio — usada nos relatórios e no custo por lead."
            icon={ClipboardListIcon}
            headingLevel={headingLevel}
          >
            <TrackingFields />
          </FormSection>

          <Separator />

          <FormSection title="Atendimento" icon={StethoscopeIcon} headingLevel={headingLevel}>
            <ServiceFields />
          </FormSection>

          <Separator />

          <FormSection title="Anotações" icon={NotebookPenIcon} headingLevel={headingLevel}>
            <NotesField />
          </FormSection>
        </fieldset>

        {edit ? (
          <EditFooter
            dirty={isDirty}
            saving={saving}
            changedLabels={changedLabels}
            onDiscard={() => form.reset(appliedRef.current)}
          />
        ) : (
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            {onCancel ? (
              <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
                Cancelar
              </Button>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <SaveIcon aria-hidden="true" />}
              {saving ? "Salvando…" : "Cadastrar lead"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

interface EditFooterProps {
  dirty: boolean;
  saving: boolean;
  changedLabels: string[];
  onDiscard: () => void;
}

/**
 * Salvar/Descartar da edição. Com alterações pendentes, fica fixo no rodapé da
 * tela (acima da barra de ações do celular) para não se perder em formulários longos.
 * Descartar pede confirmação, como nos demais formulários (um toque errado perderia a edição).
 */
function EditFooter({ dirty, saving, changedLabels, onDiscard }: EditFooterProps) {
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center",
        dirty &&
          "bg-card/95 sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-2 rounded-lg border px-3 pb-3 shadow-lg backdrop-blur md:bottom-4",
      )}
    >
      <p role="status" className="text-muted-foreground min-w-0 flex-1 text-sm">
        {dirty ? (
          <>
            <span className="text-foreground font-medium">Alterações não salvas</span>
            {changedLabels.length > 0 ? <span className="block truncate">{changedLabels.join(", ")}</span> : null}
          </>
        ) : (
          "Nenhuma alteração pendente."
        )}
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => setConfirmDiscard(true)}>
          Descartar alterações
        </Button>
        <Button type="submit" disabled={!dirty || saving}>
          {saving ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <SaveIcon aria-hidden="true" />}
          {saving ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        destructive
        title="Descartar alterações?"
        description="As alterações feitas neste lead serão perdidas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={onDiscard}
      />
    </div>
  );
}

/**
 * Edição: quando o lead muda no servidor (Realtime, outra aba, ação de status),
 * atualiza os campos que a pessoa não alterou e preserva o que ela está digitando.
 * Devolve a referência dos últimos valores aplicados (base de "Descartar alterações").
 */
function useExternalValuesSync(
  form: UseFormReturn<LeadFormValues, unknown, LeadFormOutput>,
  initialValues: LeadFormValues,
  enabled: boolean,
): React.RefObject<LeadFormValues> {
  const appliedRef = React.useRef(initialValues);

  React.useEffect(() => {
    if (!enabled || sameFormValues(appliedRef.current, initialValues)) return;
    appliedRef.current = initialValues;
    const current = form.getValues();
    const dirty = dirtyFieldNames(form.formState.dirtyFields);
    form.reset(initialValues);
    // reaplica o que está sendo editado, agora comparado com os novos valores salvos
    for (const name of dirty) form.setValue(name, current[name], { shouldDirty: true });
  }, [enabled, form, initialValues]);

  return appliedRef;
}
