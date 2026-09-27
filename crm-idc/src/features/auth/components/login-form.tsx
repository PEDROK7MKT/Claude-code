"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRightIcon, CircleAlertIcon, KeyRoundIcon, LoaderCircleIcon } from "lucide-react";

import { clearPersistedCache } from "@/components/providers/query-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { LOGIN_DEFAULT_VALUES, isInactiveAccountError, loginErrorMessage, loginSchema, type LoginValues } from "../lib/login";
import { resolvePostLoginPath } from "../lib/redirect";
import { InactiveAccountNotice } from "./login-notices";
import { PasswordInput } from "./password-input";

interface LoginFormProps {
  /** `?next=` recebido do proxy (validado antes de usar). */
  next: string | null;
  /** Veio de /auth/signout?reason=inactive. */
  inactive: boolean;
}

/**
 * Formulário de login (Supabase Auth, e-mail + senha).
 * Após autenticar, confere o profile: usuário desativado é deslogado na hora;
 * ativo segue para o `next` seguro ou para a página inicial do papel.
 */
export function LoginForm({ next, inactive }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [showInactive, setShowInactive] = React.useState(inactive);
  const [capsLock, setCapsLock] = React.useState(false);
  const [navigating, startNavigation] = React.useTransition();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: LOGIN_DEFAULT_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { setFocus } = form;

  // Foco no e-mail em telas com mouse (no celular, abrir o teclado de cara esconde o card)
  React.useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) setFocus("email");
  }, [setFocus]);

  const onSubmit = async ({ email, password }: LoginValues) => {
    setError(null);
    setShowInactive(false);
    const supabase = createClient();
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, active")
        .eq("id", data.user.id)
        .maybeSingle();

      // Falha passageira ao ler o profile não bloqueia: o layout (requireSession) confere de novo
      if (!profileError && !profile?.active) {
        await supabase.auth.signOut({ scope: "local" });
        setShowInactive(true);
        form.resetField("password");
        return;
      }

      // cache offline de outra sessão/usuário neste navegador não deve aparecer
      await clearPersistedCache();
      const destination = resolvePostLoginPath({ next, role: profile?.role });
      startNavigation(() => {
        router.replace(destination);
        router.refresh();
      });
    } catch (err) {
      if (isInactiveAccountError(err)) {
        setShowInactive(true);
        return;
      }
      setError(loginErrorMessage(err));
      setFocus("password", { shouldSelect: true });
    }
  };

  const busy = form.formState.isSubmitting || navigating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-busy={busy} className="grid gap-5">
        {showInactive ? <InactiveAccountNotice /> : null}

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
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="seu@email.com.br"
                  readOnly={busy}
                  className="h-10"
                />
              </FormControl>
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
                <PasswordInput
                  {...field}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  readOnly={busy}
                  onCapsLockChange={setCapsLock}
                  className="h-10"
                />
              </FormControl>
              {capsLock ? (
                <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <CircleAlertIcon aria-hidden="true" className="size-3.5" />
                  Caps Lock está ativado
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        {error ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" size="lg" disabled={busy} className="h-11 w-full text-base shadow-sm">
          {busy ? (
            <>
              <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRightIcon aria-hidden="true" />
            </>
          )}
        </Button>

        <p className="text-muted-foreground flex items-start justify-center gap-1.5 text-center text-xs text-pretty">
          <KeyRoundIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span>Esqueceu a senha? Peça ao administrador para redefinir.</span>
        </p>
      </form>
    </Form>
  );
}
