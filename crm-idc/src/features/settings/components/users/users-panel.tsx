"use client";

import * as React from "react";
import { UserPlusIcon, UsersIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/features/auth/session-context";
import { useProfiles } from "@/features/settings/api/app-settings";
import { getErrorMessage } from "@/lib/errors";
import { firstName } from "@/lib/format";
import type { Profile, UserRole } from "@/types/database";
import {
  describeProfilesSummary,
  needsFirstDentist,
  sortProfiles,
  summarizeProfiles,
  type UserAction,
} from "../../lib/users";
import { ChangeRoleDialog } from "./change-role-dialog";
import { CreateUserDialog } from "./create-user-dialog";
import { EditNameDialog } from "./edit-name-dialog";
import { FirstAccessCallout } from "./first-access-callout";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { useSetUserActive } from "./use-user-actions";
import { UsersList } from "./users-list";

type DialogRequest = { kind: "create"; defaultRole: UserRole } | { kind: UserAction; user: Profile };
/** `key` muda a cada abertura: o diálogo remonta limpo (formulário, etapa de sucesso). */
type DialogState = DialogRequest & { key: number };

/** Aba "Usuários": lista de profiles e ações do admin (criar, editar, perfil, senha, desativar). */
export function UsersPanel() {
  const { userId } = useSession();
  const profilesQuery = useProfiles();
  const setActive = useSetUserActive();

  // `dialog` guarda o último diálogo para o conteúdo continuar visível durante a animação de saída
  const [dialog, setDialog] = React.useState<DialogState | null>(null);
  const [open, setOpen] = React.useState(false);
  const openCount = React.useRef(0);

  const users = React.useMemo(() => sortProfiles(profilesQuery.data ?? []), [profilesQuery.data]);
  const summary = summarizeProfiles(users);
  const showFirstAccess = profilesQuery.isSuccess && needsFirstDentist(users);

  const openDialog = (next: DialogRequest) => {
    openCount.current += 1;
    setDialog({ ...next, key: openCount.current });
    setOpen(true);
  };

  const openCreate = (defaultRole: UserRole) => openDialog({ kind: "create", defaultRole });

  const onAction = (action: UserAction, user: Profile) => openDialog({ kind: action, user });

  const isOpen = (kind: DialogState["kind"]) => open && dialog?.kind === kind;

  const toggleActive = async (user: Profile, active: boolean) => {
    // rejeita em caso de erro: o ConfirmDialog continua aberto (toast já exibido)
    await setActive.mutateAsync({ userId: user.id, active, name: user.full_name });
  };

  return (
    <div className="space-y-6">
      {showFirstAccess ? <FirstAccessCallout onCreateDentist={() => openCreate("dentist")} /> : null}

      <Card className="gap-4" role="region" aria-labelledby="users-title">
        <CardHeader>
          <CardTitle id="users-title" className="text-base">
            Usuários
          </CardTitle>
          <CardDescription>
            {profilesQuery.isSuccess ? describeProfilesSummary(summary) : "Quem pode acessar o CRM"}
          </CardDescription>
          <CardAction>
            <Button type="button" size="sm" onClick={() => openCreate(showFirstAccess ? "dentist" : "admin")}>
              <UserPlusIcon aria-hidden="true" />
              <span className="hidden sm:inline">Novo usuário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {profilesQuery.isPending ? (
            <TableSkeleton rows={3} columns={5} />
          ) : profilesQuery.isError && !profilesQuery.data ? (
            <ErrorState
              size="sm"
              title="Não foi possível carregar os usuários"
              message={getErrorMessage(profilesQuery.error)}
              onRetry={() => void profilesQuery.refetch()}
              retrying={profilesQuery.isFetching}
            />
          ) : users.length === 0 ? (
            <EmptyState
              size="sm"
              icon={UsersIcon}
              title="Nenhum usuário encontrado"
              description="Crie a conta do Dr. Décio para ele acompanhar os leads."
              action={{ label: "Novo usuário", icon: UserPlusIcon, onClick: () => openCreate("dentist") }}
            />
          ) : (
            <UsersList users={users} currentUserId={userId} onAction={onAction} />
          )}
        </CardContent>
      </Card>

      {dialog?.kind === "create" ? (
        <CreateUserDialog
          key={dialog.key}
          open={isOpen("create")}
          onOpenChange={setOpen}
          defaultRole={dialog.defaultRole}
        />
      ) : null}

      {dialog && dialog.kind === "edit-name" ? (
        <EditNameDialog key={dialog.key} open={isOpen("edit-name")} onOpenChange={setOpen} user={dialog.user} />
      ) : null}

      {dialog && dialog.kind === "change-role" ? (
        <ChangeRoleDialog key={dialog.key} open={isOpen("change-role")} onOpenChange={setOpen} user={dialog.user} />
      ) : null}

      {dialog && dialog.kind === "reset-password" ? (
        <ResetPasswordDialog
          key={dialog.key}
          open={isOpen("reset-password")}
          onOpenChange={setOpen}
          user={dialog.user}
          isSelf={dialog.user.id === userId}
        />
      ) : null}

      {dialog && (dialog.kind === "deactivate" || dialog.kind === "reactivate") ? (
        <ConfirmDialog
          open={isOpen(dialog.kind)}
          onOpenChange={setOpen}
          destructive={dialog.kind === "deactivate"}
          title={
            dialog.kind === "deactivate"
              ? `Desativar o acesso de ${firstName(dialog.user.full_name)}?`
              : `Reativar o acesso de ${firstName(dialog.user.full_name)}?`
          }
          description={
            dialog.kind === "deactivate"
              ? `${dialog.user.full_name} não conseguirá mais entrar no CRM e perde o acesso aos dados imediatamente. Leads e histórico registrados por ele(a) são mantidos, e você pode reativar quando quiser.`
              : `${dialog.user.full_name} volta a entrar com o mesmo e-mail e a última senha definida.`
          }
          confirmLabel={dialog.kind === "deactivate" ? "Desativar acesso" : "Reativar acesso"}
          onConfirm={() => toggleActive(dialog.user, dialog.kind === "reactivate")}
        />
      ) : null}
    </div>
  );
}
