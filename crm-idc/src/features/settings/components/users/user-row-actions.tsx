"use client";

import * as React from "react";
import {
  InfoIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  UserCheckIcon,
  UserCogIcon,
  UserXIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/types/database";
import { userActionAvailability, type UserAction } from "../../lib/users";

export interface UserRowActionsProps {
  user: Profile;
  currentUserId: string;
  onAction: (action: UserAction, user: Profile) => void;
}

/**
 * Menu "⋯" de cada usuário. A ação escolhida só dispara depois que o menu fecha
 * e o foco volta ao botão — assim o diálogo aberto devolve o foco a ele ao fechar.
 */
export function UserRowActions({ user, currentUserId, onAction }: UserRowActionsProps) {
  const pending = React.useRef<UserAction | null>(null);
  const availability = userActionAvailability(user, currentUserId);
  const isSelf = user.id === currentUserId;

  const select = (action: UserAction) => () => {
    pending.current = action;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Ações para ${user.full_name}`}>
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60"
        onCloseAutoFocus={() => {
          const action = pending.current;
          pending.current = null;
          if (action) onAction(action, user);
        }}
      >
        <DropdownMenuLabel className="truncate">{user.full_name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={select("edit-name")}>
          <PencilIcon aria-hidden="true" />
          Editar nome
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={select("change-role")} disabled={!availability["change-role"].allowed}>
          <UserCogIcon aria-hidden="true" />
          Alterar perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={select("reset-password")}>
          <KeyRoundIcon aria-hidden="true" />
          Redefinir senha
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.active ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={select("deactivate")}
            disabled={!availability.deactivate.allowed}
          >
            <UserXIcon aria-hidden="true" />
            Desativar acesso
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={select("reactivate")}>
            <UserCheckIcon aria-hidden="true" />
            Reativar acesso
          </DropdownMenuItem>
        )}
        {isSelf ? (
          <p className="text-muted-foreground flex gap-1.5 px-2 pt-1.5 pb-1 text-xs leading-snug">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Você não pode alterar o próprio perfil nem desativar a própria conta.
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
