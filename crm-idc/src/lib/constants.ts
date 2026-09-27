import type { Competitor, LeadSource, LeadStatus, ServiceType, UserRole } from "@/types/database";

export const APP_TIMEZONE = "America/Bahia";
export const APP_LOCALE = "pt-BR";
export const PAGE_SIZE = 20;

export const SERVICES = [
  { value: "clinica_geral", label: "Clínica Geral" },
  { value: "implante", label: "Implante Dentário" },
  { value: "protese_protocolo", label: "Prótese / Protocolo" },
  { value: "estetica", label: "Estética Dental" },
  { value: "preventivo", label: "Tratamento Preventivo" },
  { value: "canal", label: "Tratamento de Canal" },
  { value: "extracao", label: "Extração" },
  { value: "clareamento", label: "Clareamento" },
  { value: "lente_contato", label: "Lentes de Contato Dental" },
  { value: "ortodontia", label: "Ortodontia" },
  { value: "odontopediatria", label: "Odontopediatria" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "sono", label: "Odontologia do Sono" },
  { value: "outro", label: "Outro" },
] as const satisfies ReadonlyArray<{ value: ServiceType; label: string }>;

export const LEAD_SOURCES = [
  { value: "google_ads", label: "Google Ads" },
  { value: "google_organico", label: "Google (orgânico)" },
  { value: "gmn", label: "Google Meu Negócio" },
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação" },
  { value: "retorno", label: "Paciente retorno" },
  { value: "outro", label: "Outro" },
] as const satisfies ReadonlyArray<{ value: LeadSource; label: string }>;

/**
 * Campanhas ativas. `value` = slug usado em utm_campaign; `label` = nome exato
 * da campanha no Google Ads. No banco (leads.campaign e daily_metrics.campaign)
 * gravamos SEMPRE o `label` (nome da campanha), para cruzar com o CSV do Google Ads.
 */
export const CAMPAIGNS = [
  { value: "idc_urgencia_canal", label: "IDC | Urgência e Canal" },
  { value: "idc_implante", label: "IDC | Implante Dentário" },
] as const;

export const COMPETITORS: readonly Competitor[] = [
  { name: "Dental Studio", rating: 5.0, reviews: 304 },
  { name: "Oralprime", rating: 5.0, reviews: 253 },
  { name: "Quero Sorrir", rating: 4.9, reviews: 313 },
  { name: "DENTEBRAS", rating: 4.9, reviews: 213 },
  { name: "Dr. Giullian Braun", rating: 4.9, reviews: 140 },
  { name: "+Sorriso", rating: 5.0, reviews: 127 },
  { name: "Sorria Bahia", rating: 4.9, reviews: 62 },
];

export const ROLES = [
  { value: "admin", label: "Gestor de tráfego (admin)" },
  { value: "dentist", label: "Dentista" },
] as const satisfies ReadonlyArray<{ value: UserRole; label: string }>;

/** Ordem canônica dos status (funil). */
export const LEAD_STATUSES = [
  "novo",
  "em_contato",
  "agendado",
  "confirmado",
  "compareceu",
  "nao_compareceu",
  "cancelado",
  "perdido",
] as const satisfies ReadonlyArray<LeadStatus>;

export interface StatusMeta {
  value: LeadStatus;
  /** Rótulo em minúsculo, usado no badge ("novo", "agendado"...) */
  label: string;
  /** Rótulo com inicial maiúscula, para títulos/colunas */
  title: string;
  /** Classes Tailwind do badge: fundo suave + texto forte */
  badgeClass: string;
  /** Cor sólida (hex) para gráficos — hex puro para funcionar em SVG exportado/PDF */
  color: string;
}

export const STATUS_META: Record<LeadStatus, StatusMeta> = {
  novo: {
    value: "novo",
    label: "novo",
    title: "Novo",
    badgeClass: "bg-blue-500/15 text-blue-700 ring-blue-500/25",
    color: "#3B82F6",
  },
  em_contato: {
    value: "em_contato",
    label: "em contato",
    title: "Em contato",
    badgeClass: "bg-yellow-400/20 text-yellow-800 ring-yellow-500/30",
    color: "#EAB308",
  },
  agendado: {
    value: "agendado",
    label: "agendado",
    title: "Agendado",
    badgeClass: "bg-purple-500/15 text-purple-700 ring-purple-500/25",
    color: "#A855F7",
  },
  confirmado: {
    value: "confirmado",
    label: "confirmado",
    title: "Confirmado",
    badgeClass: "bg-blue-900/15 text-blue-900 ring-blue-900/25",
    color: "#1E3A8A",
  },
  compareceu: {
    value: "compareceu",
    label: "compareceu",
    title: "Compareceu",
    badgeClass: "bg-green-500/15 text-green-700 ring-green-500/25",
    color: "#22C55E",
  },
  nao_compareceu: {
    value: "nao_compareceu",
    label: "não compareceu",
    title: "Não compareceu",
    badgeClass: "bg-red-500/15 text-red-700 ring-red-500/25",
    color: "#EF4444",
  },
  cancelado: {
    value: "cancelado",
    label: "cancelado",
    title: "Cancelado",
    badgeClass: "bg-gray-400/15 text-gray-600 ring-gray-400/30",
    color: "#9CA3AF",
  },
  perdido: {
    value: "perdido",
    label: "perdido",
    title: "Perdido",
    badgeClass: "bg-gray-700/15 text-gray-800 ring-gray-700/25",
    color: "#374151",
  },
};

/** Regra de negócio nº 2 — espelha public.lead_status_transition_allowed() no banco. */
export const STATUS_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  novo: ["em_contato", "perdido"],
  em_contato: ["agendado", "perdido", "cancelado"],
  agendado: ["confirmado", "cancelado", "perdido"],
  confirmado: ["compareceu", "nao_compareceu", "cancelado"],
  nao_compareceu: ["agendado"],
  cancelado: ["agendado"],
  perdido: ["em_contato"],
  compareceu: [],
};

/** Status que contam como "agendamento" nos KPIs (taxa de agendamento, custo por agendamento). */
export const SCHEDULED_STATUSES = ["agendado", "confirmado", "compareceu"] as const satisfies ReadonlyArray<LeadStatus>;

/** Status que exigem confirmação antes de aplicar (ação "destrutiva"). */
export const CONFIRM_STATUSES: readonly LeadStatus[] = ["perdido", "cancelado"];

/** Cores das fontes para gráficos (hex puro). */
export const SOURCE_COLORS: Record<LeadSource, string> = {
  google_ads: "#0D6E6E",
  google_organico: "#14B8A6",
  gmn: "#E8B931",
  instagram: "#EC4899",
  indicacao: "#8B5CF6",
  retorno: "#3B82F6",
  outro: "#9CA3AF",
};

/** Paleta da marca IDC (hex) — use nos gráficos Recharts para exportar bem em PDF. */
export const BRAND = {
  primary: "#0D6E6E",
  primaryLight: "#14B8A6",
  secondary: "#F5F5F5",
  accent: "#E8B931",
  text: "#1A1A1A",
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  muted: "#6B7280",
} as const;

export const SERVICE_LABEL: Record<ServiceType, string> = Object.fromEntries(
  SERVICES.map((s) => [s.value, s.label]),
) as Record<ServiceType, string>;

export const SOURCE_LABEL: Record<LeadSource, string> = Object.fromEntries(
  LEAD_SOURCES.map((s) => [s.value, s.label]),
) as Record<LeadSource, string>;

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Gestor de tráfego",
  dentist: "Dentista",
};

export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá {nome}! Aqui é do Instituto Décio Carrilho. Recebemos seu contato e estamos à disposição para ajudar.";

/** Chaves do React Query — compartilhadas entre features para invalidação consistente. */
export const QUERY_KEYS = {
  leads: ["leads"] as const,
  lead: (id: string) => ["leads", "detail", id] as const,
  leadHistory: (id: string) => ["leads", "history", id] as const,
  newLeadsCount: ["leads", "new-count"] as const,
  dailyMetrics: ["daily-metrics"] as const,
  gmnMetrics: ["gmn-metrics"] as const,
  profiles: ["profiles"] as const,
  settings: ["app-settings"] as const,
};
