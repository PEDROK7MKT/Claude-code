"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CircleCheckBigIcon, CopyIcon, KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";

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
import { firstName } from "@/lib/format";
import type { Profile } from "@/types/database";
import { passwordFormSchema } from "../../lib/user-schemas";
import { useCopyToClipboard } from "../use-copy-to-clipboard";
import { PasswordField } from "./password-field";
import { useResetUserPassword } from "./use-user-actions";

export interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile;
  /** O admin redefinindo a própria senha */
  isSelf: boolean;
}

/** Define uma nova senha para o usuário e mostra-a uma vez para ser repassada. */
export function ResetPasswordDialog({ open, onOpenChange, user, isSelf }: ResetPasswordDialogProps) {
  const reset = useResetUserPassword();
  const [newPassword, setNewPassword] = React.useState<string | null>(null);
  const { copy, isCopied } = useCopyToClipboard();
  const form = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "" },
    mode: "onTouched",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next && reset.isPending) return;
    onOpenChange(next);
  };

  const submit = async ({ password }: { password: string }) => {
    try {
      await reset.mutateAsync({ userId: user.id, password, name: user.full_name });
      setNewPassword(password);
    } catch {
      // toast de erro já exibido; mantém aberto
    }
  };

  const name = firstName(user.full_name);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {newPassword ? (
          <>
            <DialogHeader>
              <div className="bg-success/15 text-success mb-1 flex size-11 items-center justify-center rounded-full">
                <CircleCheckBigIcon aria-hidden="true" className="size-6" />
              </div>
              <DialogTitle>Senha redefinida</DialogTitle>
              <DialogDescription>
                {isSelf
                  ? "Use a nova senha no próximo login."
                  : `Envie a nova senha para ${name}. Ela não será exibida novamente.`}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-4">
              <code className="font-mono text-base break-all select-all">{newPassword}</code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copiar nova senha"
                onClick={() => void copy(newPassword, { successMessage: "Senha copiada" })}
              >
                {isCopied() ? <CheckIcon aria-hidden="true" className="text-success" /> : <CopyIcon aria-hidden="true" />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              <DialogDescription>
                {isSelf
                  ? "Defina uma nova senha para a sua conta."
                  : `Defina uma nova senha para ${user.full_name}. A senha atual deixa de funcionar imediatamente.`}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} noValidate className="grid gap-5">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <PasswordField
                          ref={field.ref}
                          name={field.name}
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                          onBlur={field.onBlur}
                          autoComplete="new-password"
                          placeholder="Mínimo de 8 caracteres"
                          autoFocus
                          disabled={reset.isPending}
                        />
                      </FormControl>
                      {user.email ? <FormDescription>Login: {user.email}</FormDescription> : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={reset.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={reset.isPending}>
                    {reset.isPending ? (
                      <Loader2Icon aria-hidden="true" className="animate-spin" />
                    ) : (
                      <KeyRoundIcon aria-hidden="true" />
                    )}
                    Redefinir senha
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
