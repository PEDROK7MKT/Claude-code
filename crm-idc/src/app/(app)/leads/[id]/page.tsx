import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeadDetailView } from "@/features/leads/components/detail/lead-detail-view";
import { isLeadId } from "@/features/leads/lib/lead-id";

export const metadata: Metadata = {
  title: "Detalhe do lead",
};

/**
 * /leads/[id] — detalhe e edição do lead (spec §4.3). O lead é carregado no
 * cliente (cache offline + Realtime); id fora do formato UUID vira 404 aqui.
 */
export default async function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  if (!isLeadId(id)) notFound();
  // key: ao navegar de um lead para outro (contatos vinculados), o estado da página recomeça
  return <LeadDetailView key={id} leadId={id} />;
}
