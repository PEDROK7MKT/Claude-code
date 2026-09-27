"use client";

import * as React from "react";
import { Loader2Icon, ShieldCheckIcon, StethoscopeIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ROLES } from "@/lib/constants";
import { firstName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile, UserRole } from "@/types/database";
import { ROLE_DESCRIPTIONS } from "../../lib/users";
import { useUpdateUserRole } from "./use-user-actions";

const ROLE_ICON = { admin: ShieldCheckIcon, dentist: StethoscopeIcon } as const;

function isRole(value: string): value is UserRole {
  return ROLES.some((r) => r.value === value);
}

export interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile;
}

/** Troca o perfil de acesso (gestor de tráfego ↔ dentista). */
export function ChangeRoleDialog({ open, onOpenChange, user }: ChangeRoleDialogProps) {
  const update = useUpdateUserRole();
  const [role, setRole] = React.useState<UserRole>(user.role);
  const groupId = React.useId();
  const demoting = user.role === "admin" && role === "dentist";

  const handleOpenChange = (next: boolean) => {
    if (!next && update.isPending) return;
    onOpenChange(next);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role === user.role) return;
    try {
      await update.mutateAsync({ userId: user.id, role, name: user.full_name });
      onOpenChange(false);
    } catch {
      // toast de erro já exibido; mantém aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar perfil de acesso</DialogTitle>
          <DialogDescription>Defina o que {user.full_name} pode ver e editar no CRM.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <RadioGroup
            value={role}
            onValueChange={(value) => {
              if (isRole(value)) setRole(value);
            }}
            aria-label="Perfil de acesso"
            disabled={update.isPending}
          >
            {ROLES.map((option) => {
              const Icon = ROLE_ICON[option.value];
              const itemId = `${groupId}-${option.value}`;
              const selected = role === option.value;
              return (
                <Label
                  key={option.value}
                  htmlFor={itemId}
                  className={cn(
                    "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal transition-colors",
                    selected && "border-primary bg-primary/5 ring-primary/20 ring-2",
                  )}
                >
                  <RadioGroupItem id={itemId} value={option.value} className="mt-0.5" />
                  <span className="grid gap-1">
                    <span className="flex items-center gap-2 font-medium">
                      <Icon aria-hidden="true" className="text-primary size-4" />
                      {option.label}
                      {user.role === option.value ? (
                        <span className="text-muted-foreground text-xs font-normal">(atual)</span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground text-sm leading-snug">{ROLE_DESCRIPTIONS[option.value]}</span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>

          {demoting ? (
            <Alert className="border-warning/40 bg-warning/10">
              <TriangleAlertIcon aria-hidden="true" className="text-warning" />
              <AlertTitle>{firstName(user.full_name)} perderá o acesso de gestor</AlertTitle>
              <AlertDescription>
                Deixará de lançar métricas do Google Ads e GMN e de acessar Configurações.
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={update.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending || role === user.role}>
              {update.isPending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
              Salvar perfil
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
