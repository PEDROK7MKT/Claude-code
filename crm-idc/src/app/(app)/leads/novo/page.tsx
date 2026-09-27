import type { Metadata } from "next";

import { NewLeadView } from "@/features/leads/components/form/new-lead-view";

export const metadata: Metadata = {
  title: "Novo lead",
};

/** /leads/novo — cadastro manual de lead (spec §4.3; §6.1 Opção B; regras 1 e 4). Admin e dentista cadastram. */
export default function NewLeadPage() {
  return <NewLeadView />;
}
