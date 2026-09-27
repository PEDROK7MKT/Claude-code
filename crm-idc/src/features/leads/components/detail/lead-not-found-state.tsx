import * as React from "react";
import { SearchXIcon, UserPlusIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Lead inexistente ou link inválido (usado pelo not-found.tsx da rota e quando a
 * consulta volta vazia). Leads nunca são excluídos, então é quase sempre link errado.
 */
export function LeadNotFoundState() {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardContent>
        <EmptyState
          icon={SearchXIcon}
          title="Lead não encontrado"
          description="Confira o link: este lead não existe ou você não tem acesso a ele. Leads nunca são excluídos — procure pelo nome ou telefone na lista."
          action={{ label: "Ver todos os leads", href: "/leads" }}
          secondaryAction={{ label: "Cadastrar novo lead", href: "/leads/novo", icon: UserPlusIcon, variant: "outline" }}
        />
      </CardContent>
    </Card>
  );
}
