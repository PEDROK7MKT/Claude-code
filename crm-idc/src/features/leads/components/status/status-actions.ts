/**
 * Regras de apresentação das mudanças de status (rótulos, ordem, textos de
 * confirmação e data padrão do agendamento). Funções puras — testadas em
 * status-actions.test.ts. As regras de negócio em si ficam em @/lib/lead-status.
 */
import { addDays, format, isWeekend, startOfDay } from "date-fns";

import { APP_LOCALE, LEAD_STATUSES, STATUS_META } from "@/lib/constants";
import { bahiaLocalToIso, formatAppointment, toBahia, type DateInput } from "@/lib/dates";
import { allowedTransitions, canTransition, requiresConfirmation, requiresSchedule } from "@/lib/lead-status";
import type { Lead, LeadStatus } from "@/types/database";

/** Horário sugerido ao abrir a agenda (fuso da clínica). */
export const DEFAULT_SCHEDULE_TIME = "09:00";
/** Intervalo dos horários da agenda, em minutos. */
export const SCHEDULE_MINUTE_STEP = 15;
/**
 * Folga antes de tratar o horário como "no passado": com horários de 15 em 15
 * minutos, uma consulta que começou há poucos minutos ainda é "agora".
 */
export const PAST_SCHEDULE_TOLERANCE_MS = 15 * 60 * 1000;
/** Tamanho máximo da nota registrada no histórico junto com a mudança. */
export const STATUS_NOTE_MAX_LENGTH = 500;

/** Como a mudança é aplicada: direto, pedindo data/hora ou pedindo confirmação. */
export type StatusChangeFlow = "immediate" | "schedule" | "confirm";

/** Destaque visual: próximo passo recomendado, neutro ou "destrutivo". */
export type StatusActionTone = "primary" | "neutral" | "danger";

export type QuickActionsLayout = "buttons" | "menu";

export interface StatusAction {
  to: LeadStatus;
  /** Rótulo do botão/item, no contexto do status atual (ex.: "Reagendar", "Reativar") */
  label: string;
  /** Explicação curta exibida no menu (ex.: "escolher data e horário") */
  hint: string | null;
  flow: StatusChangeFlow;
  tone: StatusActionTone;
  /** A transição é permitida a partir do status atual (regra 2) */
  allowed: boolean;
  /** É o próximo passo natural do funil */
  recommended: boolean;
  /** Por que a ação está indisponível (tooltip); null quando permitida */
  disabledReason: string | null;
}

/** Próximo passo natural de cada status (botão em destaque). */
export const RECOMMENDED_NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  novo: "em_contato",
  em_contato: "agendado",
  agendado: "confirmado",
  confirmado: "compareceu",
  nao_compareceu: "agendado",
  cancelado: "agendado",
  perdido: "em_contato",
};

/**
 * Ações rápidas do detalhe do lead (spec §4.3), na ordem do funil.
 * `core` = sempre visível no layout "buttons" (desabilitada quando não permitida);
 * as demais só aparecem quando são um próximo passo válido.
 */
export const QUICK_ACTION_SLOTS: ReadonlyArray<{ to: LeadStatus; core: boolean }> = [
  { to: "em_contato", core: false },
  { to: "agendado", core: true },
  { to: "confirmado", core: false },
  { to: "compareceu", core: true },
  { to: "nao_compareceu", core: true },
  { to: "cancelado", core: false },
  { to: "perdido", core: true },
];

function quoted(status: LeadStatus): string {
  return `"${STATUS_META[status].label}"`;
}

/** `"a", "b" ou "c"` */
export function formatStatusList(statuses: readonly LeadStatus[], type: "conjunction" | "disjunction" = "disjunction"): string {
  return new Intl.ListFormat(APP_LOCALE, { style: "long", type }).format(statuses.map(quoted));
}

export function statusChangeFlow(to: LeadStatus): StatusChangeFlow {
  if (requiresSchedule(to)) return "schedule";
  if (requiresConfirmation(to)) return "confirm";
  return "immediate";
}

/** Agendamento a partir de "não compareceu"/"cancelado" é um reagendamento. */
export function isReschedule(from: LeadStatus): boolean {
  return from === "nao_compareceu" || from === "cancelado";
}

function hasAppointment(status: LeadStatus): boolean {
  return status === "agendado" || status === "confirmado";
}

/** Rótulo da ação `from → to`, com o verbo adequado ao contexto. */
export function statusActionLabel(from: LeadStatus, to: LeadStatus): string {
  switch (to) {
    case "novo":
      return "Novo";
    case "em_contato":
      return from === "perdido" ? "Reativar" : "Em contato";
    case "agendado":
      return isReschedule(from) ? "Reagendar" : "Marcar como agendado";
    case "confirmado":
      return "Confirmar presença";
    case "compareceu":
      return "Compareceu";
    case "nao_compareceu":
      return "Não compareceu";
    case "cancelado":
      return hasAppointment(from) ? "Cancelar agendamento" : "Marcar como cancelado";
    case "perdido":
      return "Marcar como perdido";
  }
}

function statusActionHint(from: LeadStatus, to: LeadStatus): string | null {
  switch (statusChangeFlow(to)) {
    case "schedule":
      return "escolher data e horário";
    case "confirm":
      return "pede confirmação";
    default:
      return from === "perdido" && to === "em_contato" ? "volta para o funil" : null;
  }
}

/** Frase com os próximos passos permitidos (ou aviso de status final). */
export function describeAllowedTransitions(from: LeadStatus): string {
  const allowed = allowedTransitions(from);
  if (!allowed.length) return `${quoted(from)} é um status final: não há próximas etapas.`;
  return `Próximas etapas a partir de ${quoted(from)}: ${formatStatusList(allowed)}.`;
}

/** Tooltip de uma ação indisponível; null quando a transição é permitida. */
export function unavailableActionReason(from: LeadStatus, to: LeadStatus): string | null {
  if (canTransition(from, to)) return null;
  if (from === to) return `O lead já está como ${quoted(to)}.`;
  const allowed = allowedTransitions(from);
  if (!allowed.length) return `Leads ${quoted(from)} não mudam mais de status (status final).`;
  return `Indisponível para leads ${quoted(from)}. Próximas etapas: ${formatStatusList(allowed)}.`;
}

export function getStatusAction(from: LeadStatus, to: LeadStatus): StatusAction {
  const flow = statusChangeFlow(to);
  const allowed = canTransition(from, to);
  const recommended = allowed && RECOMMENDED_NEXT_STATUS[from] === to;
  return {
    to,
    label: statusActionLabel(from, to),
    hint: statusActionHint(from, to),
    flow,
    tone: recommended ? "primary" : flow === "confirm" ? "danger" : "neutral",
    allowed,
    recommended,
    disabledReason: allowed ? null : unavailableActionReason(from, to),
  };
}

/**
 * Ações rápidas para o status atual.
 * - "buttons": ações principais sempre (desabilitadas quando inválidas) + contextuais válidas
 * - "menu": somente as ações válidas
 */
export function getQuickActions(from: LeadStatus, layout: QuickActionsLayout = "buttons"): StatusAction[] {
  return QUICK_ACTION_SLOTS.flatMap(({ to, core }) => {
    const action = getStatusAction(from, to);
    if (action.allowed || (layout === "buttons" && core)) return [action];
    return [];
  });
}

/** Todas as transições permitidas a partir de `from`, na ordem do funil. */
export function getStatusChangeOptions(from: LeadStatus): StatusAction[] {
  const allowed = allowedTransitions(from);
  return LEAD_STATUSES.filter((status) => allowed.includes(status)).map((to) => getStatusAction(from, to));
}

// -----------------------------------------------------------------------------
// Textos dos diálogos
// -----------------------------------------------------------------------------

type LeadSummary = Pick<Lead, "name" | "status" | "scheduled_at">;

function displayName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : "este lead";
}

export interface ConfirmCopy {
  title: string;
  description: string;
  confirmLabel: string;
  noteLabel: string;
  notePlaceholder: string;
}

/** Textos da confirmação de mudanças "destrutivas" (perdido, cancelado). */
export function getConfirmCopy(lead: LeadSummary, to: LeadStatus): ConfirmCopy {
  const name = displayName(lead.name);
  const appointment = hasAppointment(lead.status) && lead.scheduled_at ? formatAppointment(lead.scheduled_at) : null;

  if (to === "perdido") {
    const lostAppointment = appointment ? ` A consulta de ${appointment} deixa de contar como agendamento.` : "";
    return {
      title: `Marcar ${name} como perdido?`,
      description:
        "Leads não são excluídos: o lead fica como perdido, o histórico é mantido e ele pode ser reativado depois " +
        `(volta para "em contato").${lostAppointment}`,
      confirmLabel: "Marcar como perdido",
      noteLabel: "Motivo (opcional)",
      notePlaceholder: "Ex.: não respondeu após 3 tentativas, achou o valor alto…",
    };
  }

  if (to === "cancelado") {
    if (hasAppointment(lead.status)) {
      return {
        title: `Cancelar o agendamento de ${name}?`,
        description:
          `${appointment ? `A consulta de ${appointment}` : "A consulta"} será marcada como cancelada. ` +
          "O lead continua no CRM e pode ser reagendado quando o paciente quiser.",
        confirmLabel: "Cancelar agendamento",
        noteLabel: "Motivo do cancelamento (opcional)",
        notePlaceholder: "Ex.: paciente vai viajar e pediu para remarcar no próximo mês…",
      };
    }
    return {
      title: `Marcar ${name} como cancelado?`,
      description: "O lead fica como cancelado e pode ser reagendado depois. Nada é excluído e o histórico é mantido.",
      confirmLabel: "Marcar como cancelado",
      noteLabel: "Motivo (opcional)",
      notePlaceholder: "Ex.: paciente desistiu por enquanto, prefere retornar depois…",
    };
  }

  return {
    title: `Mudar ${name} para "${STATUS_META[to].label}"?`,
    description: "A mudança fica registrada no histórico do lead.",
    confirmLabel: "Confirmar",
    noteLabel: "Observação (opcional)",
    notePlaceholder: "Ex.: detalhes da mudança…",
  };
}

export interface ScheduleCopy {
  title: string;
  description: string;
  submitLabel: string;
  /** Texto sobre o agendamento anterior (reagendamento), se houver */
  previous: string | null;
}

export function getScheduleCopy(lead: LeadSummary): ScheduleCopy {
  const name = displayName(lead.name);
  const reschedule = isReschedule(lead.status);
  const previousAt = lead.scheduled_at ? formatAppointment(lead.scheduled_at) : null;
  let previous: string | null = null;
  if (reschedule && previousAt) {
    previous =
      lead.status === "nao_compareceu"
        ? `Não compareceu à consulta de ${previousAt}.`
        : `A consulta de ${previousAt} foi cancelada.`;
  }
  return {
    title: reschedule ? "Reagendar consulta" : "Agendar consulta",
    description: `Escolha a data e o horário da consulta de ${name}.`,
    submitLabel: reschedule ? "Reagendar" : "Agendar",
    previous,
  };
}

// -----------------------------------------------------------------------------
// Data padrão do agendamento
// -----------------------------------------------------------------------------

/** Próximo dia útil (seg–sex) após `now`, no fuso da clínica (yyyy-MM-dd). */
export function nextBusinessDayKey(now: DateInput = Date.now()): string {
  let day = addDays(startOfDay(toBahia(now)), 1);
  while (isWeekend(day)) day = addDays(day, 1);
  return format(day, "yyyy-MM-dd");
}

/** Sugestão inicial da agenda: próximo dia útil às 09:00 (Barreiras/BA), em ISO UTC. */
export function defaultScheduleIso(now: DateInput = Date.now()): string {
  return bahiaLocalToIso(nextBusinessDayKey(now), DEFAULT_SCHEDULE_TIME);
}

/** O horário já passou (com a folga de PAST_SCHEDULE_TOLERANCE_MS)? */
export function isPastSchedule(
  iso: string | null | undefined,
  now: DateInput = Date.now(),
  toleranceMs: number = PAST_SCHEDULE_TOLERANCE_MS,
): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return false;
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  return time < nowMs - toleranceMs;
}
