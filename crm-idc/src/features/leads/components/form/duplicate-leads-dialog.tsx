"use client";

import * as React from "react";
import { ExternalLinkIcon, Link2Icon, Loader2Icon, PlusIcon, UsersRoundIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useClock } from "@/features/leads/components/list/use-clock";
import { isOpenLead, sortDuplicates, suggestParentLead, summarizeDuplicates } from "@/features/leads/lib/lead-duplicates";
import { formatEntryAge } from "@/features/leads/lib/list-display";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";
import { firstName, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";

export type DuplicateAction = "link" | "create";

export interface DuplicateLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: readonly Lead[];
  /** Nome digitado no cadastro */
  leadName: string;
  /** Telefone (só dígitos) */
  phone: string;
  /** Ação salvando (trava o diálogo) */
  pending: DuplicateAction | null;
  onOpenExisting: (lead: Lead) => void;
  onLink: (lead: Lead) => void;
  onCreateAnyway: () => void;
}

/**
 * Regra 4 — telefone já cadastrado: abrir o lead existente, vincular o novo
 * cadastro a ele (parent_lead_id), criar mesmo assim ou cancelar.
 */
export function DuplicateLeadsDialog({
  open,
  onOpenChange,
  duplicates,
  leadName,
  phone,
  pending,
  onOpenExisting,
  onLink,
  onCreateAnyway,
}: DuplicateLeadsDialogProps) {
  const sorted = React.useMemo(() => sortDuplicates(duplicates), [duplicates]);
  const [selectedId, setSelectedId] = React.useState(() => suggestParentLead(duplicates)?.id ?? sorted[0]?.id ?? "");
  const selected = sorted.find((lead) => lead.id === selectedId) ?? sorted[0] ?? null;
  const summary = summarizeDuplicates(duplicates);
  const busy = pending !== null;
  const now = useClock();
  const who = firstName(leadName) || "este contato";

  const handleOpenChange = (next: boolean) => {
    if (!next && busy) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl" aria-busy={busy || undefined} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRoundIcon aria-hidden="true" className="size-5 text-amber-600" />
            {summary.title}
          </DialogTitle>
          <DialogDescription>
            O telefone <span className="text-foreground font-medium tabular-nums">{formatPhone(phone)}</span> já está em{" "}
            {sorted.length === 1 ? "um lead" : `${sorted.length} leads`}. Escolha o que fazer com o cadastro de {who}.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selected?.id ?? ""}
          onValueChange={setSelectedId}
          aria-label="Lead existente com este telefone"
          disabled={busy}
          className="max-h-72 gap-2 overflow-y-auto pr-1"
        >
          {sorted.map((lead) => {
            const itemId = `duplicate-${lead.id}`;
            const checked = lead.id === selected?.id;
            return (
              <Label
                key={lead.id}
                htmlFor={itemId}
                className={cn(
                  "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal transition-colors",
                  checked && "border-primary/50 bg-primary/5 hover:bg-primary/5",
                )}
              >
                <RadioGroupItem id={itemId} value={lead.id} className="mt-0.5" />
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground truncate font-medium">{lead.name.trim() || "Sem nome"}</span>
                    <StatusBadge status={lead.status} />
                    {isOpenLead(lead.status) ? (
                      <span className="text-primary text-xs font-medium">em andamento</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums">
                    <span>Entrada: {formatDate(lead.created_at)}</span>
                    <span title={formatDateTime(lead.updated_at)}>
                      Última atualização: {formatEntryAge(lead.updated_at, now)}
                    </span>
                    {lead.service ? <span>{SERVICE_LABEL[lead.service]}</span> : null}
                  </span>
                </span>
              </Label>
            );
          })}
        </RadioGroup>

        <ul className="text-muted-foreground grid gap-1 text-xs">
          <li>
            <span className="text-foreground font-medium">Vincular</span>: cria o novo lead ligado ao escolhido
            (histórico de contatos do mesmo paciente).
          </li>
          <li>
            <span className="text-foreground font-medium">Criar novo mesmo assim</span>: cria um lead independente.
          </li>
        </ul>

        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:justify-stretch">
          <Button type="button" disabled={busy || !selected} onClick={() => selected && onLink(selected)}>
            {pending === "link" ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <Link2Icon aria-hidden="true" />}
            Vincular ao lead existente
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !selected}
            onClick={() => selected && onOpenExisting(selected)}
          >
            <ExternalLinkIcon aria-hidden="true" />
            Abrir lead existente
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCreateAnyway}>
            {pending === "create" ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <PlusIcon aria-hidden="true" />}
            Criar novo mesmo assim
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
