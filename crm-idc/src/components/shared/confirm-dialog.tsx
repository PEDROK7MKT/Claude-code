"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Elemento que abre o diálogo (modo não controlado), ex.: `<Button>Marcar como perdido</Button>`. */
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Botão de confirmação vermelho (ações destrutivas). */
  destructive?: boolean;
  /**
   * Executado ao confirmar. Se retornar Promise, mostra spinner e mantém o diálogo
   * aberto até resolver; fecha no sucesso e permanece aberto se rejeitar
   * (o erro deve ser comunicado pelo chamador, ex.: toast da mutation).
   */
  onConfirm: () => void | Promise<unknown>;
  /** Desabilita o botão de confirmar (ex.: nota obrigatória vazia). */
  confirmDisabled?: boolean;
  /** Campos extras entre a descrição e os botões (ex.: Textarea de nota). */
  children?: React.ReactNode;
}

/** Confirmação antes de ações destrutivas (perdido, cancelado, excluir, desativar). */
export function ConfirmDialog({
  open: openProp,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const open = openProp ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const handleOpenChange = (next: boolean) => {
    // Não fecha (Esc/clique fora/Cancelar) enquanto a confirmação está em andamento.
    if (!next && pending) return;
    setOpen(next);
  };

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Mantém aberto para o usuário tentar novamente.
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent aria-busy={pending || undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : (
            <AlertDialogDescription className="sr-only">Confirme para continuar.</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children ? <div className="grid gap-3">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending || confirmDisabled}
          >
            {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
