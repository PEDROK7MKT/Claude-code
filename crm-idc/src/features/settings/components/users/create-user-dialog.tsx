"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CircleCheckBigIcon, CopyIcon, Loader2Icon, UserPlusIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSettings } from "@/features/settings/api/app-settings";
import { ROLES, ROLE_LABEL } from "@/lib/constants";
import { firstName } from "@/lib/format";
import type { UserRole } from "@/types/database";
import { CREATE_USER_DEFAULTS, createUserSchema, type CreateUserValues } from "../../lib/user-schemas";
import { ROLE_DESCRIPTIONS, accessMessage } from "../../lib/users";
import { useCopyToClipboard } from "../use-copy-to-clipboard";
import { PasswordField } from "./password-field";
import { useCreateUser } from "./use-user-actions";

export interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Perfil pré-selecionado (primeiro acesso: dentista) */
  defaultRole: UserRole;
}

/**
 * "Novo usuário": cria a conta e mostra os dados de acesso para repassar (spec §11).
 * O pai remonta o diálogo (key) a cada abertura, então ele sempre começa limpo.
 */
export function CreateUserDialog({ open, onOpenChange, defaultRole }: CreateUserDialogProps) {
  const create = useCreateUser();
  const [created, setCreated] = React.useState<CreateUserValues | null>(null);
  // remonta o formulário limpo a cada "Criar outro"
  const [formKey, setFormKey] = React.useState(0);

  const handleOpenChange = (next: boolean) => {
    if (!next && create.isPending) return;
    onOpenChange(next);
  };

  const submit = async (values: CreateUserValues) => {
    await create.mutateAsync(values);
    setCreated(values);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-busy={create.isPending || undefined}>
        {created ? (
          <CreatedUserSummary
            user={created}
            onCreateAnother={() => {
              setCreated(null);
              setFormKey((k) => k + 1);
            }}
            onDone={() => handleOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Novo usuário</DialogTitle>
              <DialogDescription>
                A conta já nasce confirmada: a pessoa entra com o e-mail e a senha definidos aqui.
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm
              key={formKey}
              defaultRole={defaultRole}
              saving={create.isPending}
              onSubmit={submit}
              onCancel={() => handleOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreateUserFormProps {
  defaultRole: UserRole;
  saving: boolean;
  onSubmit: (values: CreateUserValues) => Promise<void>;
  onCancel: () => void;
}

function CreateUserForm({ defaultRole, saving, onSubmit, onCancel }: CreateUserFormProps) {
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { ...CREATE_USER_DEFAULTS, role: defaultRole },
    mode: "onTouched",
  });
  const role = useWatch({ control: form.control, name: "role" });

  const handleSubmit = async (values: CreateUserValues) => {
    try {
      await onSubmit(values);
    } catch {
      // toast de erro já exibido; o formulário continua aberto para correção
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-5">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="Ex.: Décio Carrilho" autoFocus disabled={saving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="nome@institutodeciocarrilho.com.br"
                  disabled={saving}
                />
              </FormControl>
              <FormDescription>Será o login. Não é enviado e-mail de confirmação.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <PasswordField
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  disabled={saving}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Perfil de acesso</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{role ? ROLE_DESCRIPTIONS[role] : "Escolha o que a pessoa poderá ver e editar."}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <UserPlusIcon aria-hidden="true" />}
            {saving ? "Criando..." : "Criar usuário"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface CreatedUserSummaryProps {
  user: CreateUserValues;
  onCreateAnother: () => void;
  onDone: () => void;
}

/** Depois de criar: dados de acesso para copiar e enviar (a senha não é exibida de novo). */
function CreatedUserSummary({ user, onCreateAnother, onDone }: CreatedUserSummaryProps) {
  const { data: settings } = useAppSettings();
  const { copy, isCopied } = useCopyToClipboard();

  const copyAccess = () => {
    const loginUrl = `${window.location.origin}/login`;
    const text = accessMessage({
      fullName: user.full_name,
      email: user.email,
      password: user.password,
      loginUrl,
      crmName: settings?.crm_name ?? "CRM",
    });
    void copy(text, { key: "access", successMessage: "Dados de acesso copiados" });
  };

  return (
    <>
      <DialogHeader>
        <div className="bg-success/15 text-success mb-1 flex size-11 items-center justify-center rounded-full">
          <CircleCheckBigIcon aria-hidden="true" className="size-6" />
        </div>
        <DialogTitle>Conta de {firstName(user.full_name)} criada</DialogTitle>
        <DialogDescription>
          Envie os dados abaixo para {firstName(user.full_name)}. Por segurança, a senha não será exibida novamente.
        </DialogDescription>
      </DialogHeader>

      <dl className="bg-muted/50 grid gap-3 rounded-lg border p-4 text-sm">
        <SummaryRow label="Nome" value={user.full_name} />
        <SummaryRow label="E-mail (login)" value={user.email} mono />
        <SummaryRow label="Senha" value={user.password} mono />
        <SummaryRow label="Perfil" value={ROLE_LABEL[user.role]} />
      </dl>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button type="button" variant="ghost" onClick={onCreateAnother}>
          <UserPlusIcon aria-hidden="true" />
          Criar outro
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={copyAccess}>
            {isCopied("access") ? (
              <CheckIcon aria-hidden="true" className="text-success" />
            ) : (
              <CopyIcon aria-hidden="true" />
            )}
            Copiar dados de acesso
          </Button>
          <Button type="button" onClick={onDone}>
            Concluir
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[8rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono break-all select-all" : "font-medium break-words"}>{value}</dd>
    </div>
  );
}
