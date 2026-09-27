"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import type { Profile } from "@/types/database";
import { editNameFormSchema } from "../../lib/user-schemas";
import { useUpdateUserName } from "./use-user-actions";

export interface EditNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile;
}

/** Corrige o nome exibido no CRM (sidebar, histórico de status dos leads). */
export function EditNameDialog({ open, onOpenChange, user }: EditNameDialogProps) {
  const update = useUpdateUserName();
  const form = useForm({
    resolver: zodResolver(editNameFormSchema),
    defaultValues: { full_name: user.full_name },
    mode: "onTouched",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next && update.isPending) return;
    onOpenChange(next);
  };

  const submit = async ({ full_name }: { full_name: string }) => {
    if (full_name === user.full_name) {
      onOpenChange(false);
      return;
    }
    try {
      await update.mutateAsync({ userId: user.id, fullName: full_name });
      onOpenChange(false);
    } catch {
      // toast de erro já exibido; mantém aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar nome</DialogTitle>
          <DialogDescription>O nome aparece na barra lateral e no histórico dos leads.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} noValidate className="grid gap-5">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" autoFocus disabled={update.isPending} />
                  </FormControl>
                  {user.email ? <FormDescription>Login: {user.email}</FormDescription> : null}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={update.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
                Salvar nome
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
