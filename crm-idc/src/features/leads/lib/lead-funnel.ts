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

/**
 * Etapa alcançada garantida pelo status. -1: status que interrompe o funil em
 * qualquer ponto (cancelado, perdido) — a etapa vem das datas gravadas.
 */
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

  // Em andamento/finalizado: o status define a etapa (datas além dela são de um ciclo
  // anterior, ex.: lead perdido e reativado). Cancelado/perdido: última data gravada.
  const stage = STAGE_BY_STATUS[lead.status];
  let reached = 0;
  if (stage >= 0) reached = stage;
  else {
    dates.forEach((date, index) => {
      if (date) reached = index;
    });
  }

  const stopped = STOPPED_LABEL[lead.status] ?? null;
  const finished = lead.status === "compareceu";

  return STEP_DEFS.map((def, index): FunnelStep => {
    const date = index <= reached ? dates[index] : null;
    const base = { key: def.key, label: def.label, date };

    if (index <= reached) {
      let description: string | null = null;
      if (def.key === "agendamento") description = date ? "Data da consulta" : "Sem data registrada";
      else if (def.key !== "entrada" && !date) description = "Sem data registrada";
      return { ...base, state: "done", description };
    }
    if (index === reached + 1 && !finished) {
      if (stopped) return { ...base, state: "missed", description: stopped };
      return { ...base, state: "current", description: def.waiting };
    }
    return { ...base, state: "upcoming", description: null };
  });
}

/** Etapas concluídas × total (texto de progresso e leitores de tela). */
export function funnelProgress(steps: readonly FunnelStep[]): { completed: number; total: number } {
  return { completed: steps.filter((step) => step.state === "done").length, total: steps.length };
}
