/**
 * Linha do tempo do funil no detalhe do lead: Entrada → Contato → Agendamento
 * → Confirmação → Comparecimento, com as datas gravadas pelo banco
 * (created_at, contacted_at, scheduled_at, confirmed_at, attended_at).
 */
import type { Lead, LeadStatus } from "@/types/database";

export type FunnelStepKey = "entrada" | "contato" | "agendamento" | "confirmacao" | "comparecimento";

/**
 * - done: etapa concluída (tem data)
 * - current: próxima etapa esperada (lead em andamento)
 * - upcoming: ainda não alcançada
 * - missed: onde o funil parou (não compareceu, cancelado, perdido)
 */
export type FunnelStepState = "done" | "current" | "upcoming" | "missed";

export interface FunnelStep {
  key: FunnelStepKey;
  label: string;
  /** ISO da etapa (Agendamento = data/hora da consulta) */
  date: string | null;
  state: FunnelStepState;
  /** Texto curto abaixo do rótulo (ex.: "Aguardando confirmação") */
  description: string | null;
}

type FunnelLead = Pick<Lead, "status" | "created_at" | "contacted_at" | "scheduled_at" | "confirmed_at" | "attended_at">;

const STEP_DEFS: ReadonlyArray<{ key: FunnelStepKey; label: string; field: keyof FunnelLead; waiting: string }> = [
  { key: "entrada", label: "Entrada", field: "created_at", waiting: "Lead cadastrado" },
  { key: "contato", label: "Contato", field: "contacted_at", waiting: "Aguardando contato" },
  { key: "agendamento", label: "Agendamento", field: "scheduled_at", waiting: "Aguardando agendamento" },
  { key: "confirmacao", label: "Confirmação", field: "confirmed_at", waiting: "Aguardando confirmação" },
  { key: "comparecimento", label: "Comparecimento", field: "attended_at", waiting: "Aguardando a consulta" },
];

/** Status que encerram (ou interrompem) o funil — sem "próxima etapa" destacada. */
const STOPPED_LABEL: Partial<Record<LeadStatus, string>> = {
  perdido: "Lead perdido",
  cancelado: "Consulta cancelada",
  nao_compareceu: "Não compareceu",
};

/** Etapas esperadas por status (datas podem faltar em leads antigos/importados). */
const STAGE_BY_STATUS: Record<LeadStatus, number> = {
  novo: 0,
  em_contato: 1,
  agendado: 2,
  confirmado: 3,
  compareceu: 4,
  nao_compareceu: 3,
  cancelado: -1,
  perdido: -1,
};

export function buildFunnelSteps(lead: FunnelLead): FunnelStep[] {
  const dates = STEP_DEFS.map((def) => (lead[def.field] as string | null) ?? null);

  // Última etapa alcançada: a maior entre as datas gravadas e o que o status garante.
  let reached = 0;
  dates.forEach((date, index) => {
    if (date) reached = Math.max(reached, index);
  });
  reached = Math.max(reached, STAGE_BY_STATUS[lead.status]);
  // Não compareceu: a consulta (comparecimento) não aconteceu, mesmo com attended_at antigo.
  if (lead.status === "nao_compareceu") reached = Math.min(reached, 3);

  const stopped = STOPPED_LABEL[lead.status] ?? null;
  const finished = lead.status === "compareceu";

  return STEP_DEFS.map((def, index): FunnelStep => {
    const date = index <= reached ? dates[index] : null;
    const base = { key: def.key, label: def.label, date };

    if (index <= reached) {
      const description = def.key === "entrada" ? null : date ? null : "Sem data registrada";
      return { ...base, state: "done", description };
    }
    if (index === reached + 1 && !finished) {
      if (stopped) return { ...base, state: "missed", description: stopped };
      return { ...base, state: "current", description: def.waiting };
    }
    return { ...base, state: "upcoming", description: null };
  });
}

/** Índice (0-based) da etapa atual/ponto de parada — para aria-current e barra de progresso. */
export function funnelProgress(steps: readonly FunnelStep[]): { completed: number; total: number } {
  return { completed: steps.filter((step) => step.state === "done").length, total: steps.length };
}
