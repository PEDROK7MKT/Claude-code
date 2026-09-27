"use client";

import * as React from "react";
import { ArrowRightIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lead, LeadStatus } from "@/types/database";

import { STATUS_NOTE_MAX_LENGTH, getConfirmCopy } from "./status-actions";

export interface StatusConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Pick<Lead, "name" | "status" | "scheduled_at">;
  /** Status de destino — normalmente "perdido" ou "cancelado" (CONFIRM_STATUSES) */
  to: LeadStatus;
  /**
   * Recebe a nota (ou null). Se retornar Promise, o diálogo mostra carregamento,
   * fecha no sucesso e continua aberto em caso de erro (o toast vem da mutation).
   */
  onConfirm: (note: string | null) => void | Promise<unknown>;
  /** Nota pré-preenchida */
  defaultNote?: string | null;
}

/**
 * Confirmação de mudanças "destrutivas" (perdido, cancelado): explica a
 * consequência — leads nunca são excluídos — e aceita um motivo opcional,
 * registrado no histórico junto com a mudança.
 */
export function StatusConfirmDialog({ open, onOpenChange, lead, to, onConfirm, defaultNote }: StatusConfirmDialogProps) {
  const copy = getConfirmCopy(lead, to);
  const noteId = React.useId();
  const counterId = React.useId();
  const [note, setNote] = React.useState(defaultNote ?? "");
  const [wasOpen, setWasOpen] = React.useState(open);

  // Cada abertura começa com a nota padrão (o componente pode ser reaproveitado).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setNote(defaultNote ?? "");
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      cancelLabel="Voltar"
      destructive
      onConfirm={() => onConfirm(note.trim() || null)}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm" aria-hidden="true">
        <StatusBadge status={lead.status} />
        <ArrowRightIcon className="text-muted-foreground size-4" />
        <StatusBadge status={to} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={noteId}>{copy.noteLabel}</Label>
        <Textarea
          id={noteId}
          value={note}
          maxLength={STATUS_NOTE_MAX_LENGTH}
          placeholder={copy.notePlaceholder}
          aria-describedby={counterId}
          className="max-h-40"
          onChange={(event) => setNote(event.target.value)}
        />
        <p id={counterId} className="text-muted-foreground flex justify-between gap-2 text-xs">
          <span>O motivo fica registrado no histórico do lead.</span>
          <span className="shrink-0 tabular-nums">
            {note.length}/{STATUS_NOTE_MAX_LENGTH}
          </span>
        </p>
      </div>
    </ConfirmDialog>
  );
}
