import { StethoscopeIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface FirstAccessCalloutProps {
  onCreateDentist: () => void;
}

const STEPS = [
  "Crie a conta do Dr. Décio com e-mail e senha.",
  "Copie os dados de acesso e envie para ele (WhatsApp ou pessoalmente).",
  "Ele entra pela tela de login e já acompanha e atualiza os leads.",
] as const;

/** Spec §11 "Primeiro acesso": guia enquanto não há dentista ativo no CRM. */
export function FirstAccessCallout({ onCreateDentist }: FirstAccessCalloutProps) {
  return (
    <section
      aria-labelledby="first-access-title"
      className="border-primary/20 from-primary/10 via-primary/5 to-gold/10 relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 sm:p-6"
    >
      <div aria-hidden="true" className="bg-gold/20 absolute -top-10 -right-10 size-32 rounded-full blur-2xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm">
            <StethoscopeIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-2">
            <h2 id="first-access-title" className="text-foreground font-semibold text-balance">
              Primeiro acesso: crie a conta do Dr. Décio
            </h2>
            <ol className="text-muted-foreground space-y-1 text-sm">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-2">
                  <span className="bg-card text-primary ring-primary/20 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-pretty">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <Button type="button" onClick={onCreateDentist} className="sm:shrink-0">
          <UserPlusIcon aria-hidden="true" />
          Criar conta do dentista
        </Button>
      </div>
    </section>
  );
}
