import { LeadNotFoundState } from "@/features/leads/components/detail/lead-not-found-state";

/** notFound() em /leads/[id] (id inválido): mensagem própria de lead, dentro do shell. */
export default function LeadNotFound() {
  return <LeadNotFoundState />;
}
