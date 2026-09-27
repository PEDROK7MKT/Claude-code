"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createUser,
  resetUserPassword,
  setUserActive,
  updateUserName,
  updateUserRole,
} from "@/features/settings/actions/users";
import { QUERY_KEYS, ROLE_LABEL } from "@/lib/constants";
import { AppError, GENERIC_ERROR_MESSAGE, getErrorMessage } from "@/lib/errors";
import { firstName } from "@/lib/format";
import type { UserRole } from "@/types/database";
import type { ActionResult, CreateUserValues } from "../../lib/user-schemas";

/**
 * Server Action de usuário como mutation do TanStack Query: estado de envio,
 * toast de sucesso/erro (uma vez só) e recarga da lista de profiles.
 */
function useUserActionMutation<TVariables>(
  action: (variables: TVariables) => Promise<ActionResult>,
  successMessage: (variables: TVariables) => string,
): UseMutationResult<void, Error, TVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.profiles, "admin"],
    mutationFn: async (variables: TVariables) => {
      const result = await action(variables);
      // resultado ausente = a action redirecionou (sessão expirada / sem permissão)
      if (!result) throw new AppError(GENERIC_ERROR_MESSAGE);
      if (!result.ok) throw new AppError(result.error);
    },
    onSuccess: (_data, variables) => {
      toast.success(successMessage(variables));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles }),
  });
}

export function useCreateUser() {
  return useUserActionMutation(
    (values: CreateUserValues) => createUser(values),
    (values) => `Usuário ${firstName(values.full_name)} criado`,
  );
}

export interface UserNameVariables {
  userId: string;
  fullName: string;
}

export function useUpdateUserName() {
  return useUserActionMutation(
    ({ userId, fullName }: UserNameVariables) => updateUserName(userId, fullName),
    () => "Nome atualizado",
  );
}

export interface UserRoleVariables {
  userId: string;
  role: UserRole;
  name: string;
}

export function useUpdateUserRole() {
  return useUserActionMutation(
    ({ userId, role }: UserRoleVariables) => updateUserRole(userId, role),
    ({ role, name }) => `${firstName(name)} agora é ${ROLE_LABEL[role].toLowerCase()}`,
  );
}

export interface UserActiveVariables {
  userId: string;
  active: boolean;
  name: string;
}

export function useSetUserActive() {
  return useUserActionMutation(
    ({ userId, active }: UserActiveVariables) => setUserActive(userId, active),
    ({ active, name }) => (active ? `Acesso de ${firstName(name)} reativado` : `Acesso de ${firstName(name)} desativado`),
  );
}

export interface UserPasswordVariables {
  userId: string;
  password: string;
  name: string;
}

export function useResetUserPassword() {
  return useUserActionMutation(
    ({ userId, password }: UserPasswordVariables) => resetUserPassword(userId, password),
    ({ name }) => `Senha de ${firstName(name)} redefinida`,
  );
}
