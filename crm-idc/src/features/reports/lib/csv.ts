/**
 * Exportação CSV dos leads do mês para o Excel pt-BR: separador ";", BOM UTF-8,
 * quebras de linha CRLF, datas dd/MM/yyyy HH:mm no fuso America/Bahia e
 * colunas em português. Função pura (o download fica no componente).
 */
import { SERVICE_LABEL, SOURCE_LABEL, STATUS_META } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { formatPhone } from "@/lib/format";
import type { Lead } from "@/types/database";

export const CSV_DELIMITER = ";";
export const CSV_BOM = "﻿";
export const CSV_LINE_BREAK = "\r\n";

interface CsvColumn {
  header: string;
  value: (lead: Lead) => string;
}

function dateTime(value: string | null): string {
  return value ? formatDateTime(value) : "";
}

function text(value: string | null | undefined): string {
  return value ?? "";
}

/** Valor em reais sem símbolo e sem milhar ("1234,56") — o Excel pt-BR reconhece como número. */
function decimal(value: number | string | null): string {
  if (value == null || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : "";
}

export const LEADS_CSV_COLUMNS: readonly CsvColumn[] = [
  { header: "Nome", value: (l) => l.name.trim() },
  { header: "Telefone", value: (l) => formatPhone(l.phone) },
  { header: "Fonte", value: (l) => SOURCE_LABEL[l.source] ?? l.source },
  { header: "Campanha", value: (l) => text(l.campaign) },
  { header: "Palavra-chave", value: (l) => text(l.keyword) },
  { header: "Grupo de anúncios", value: (l) => text(l.ad_group) },
  { header: "Página de destino", value: (l) => text(l.landing_page) },
  { header: "Serviço", value: (l) => (l.service ? (SERVICE_LABEL[l.service] ?? l.service) : "") },
  { header: "Detalhe do serviço", value: (l) => text(l.service_detail) },
  { header: "Status", value: (l) => STATUS_META[l.status]?.title ?? l.status },
  { header: "Data de entrada", value: (l) => dateTime(l.created_at) },
  { header: "Primeiro contato", value: (l) => dateTime(l.contacted_at) },
  { header: "Agendamento", value: (l) => dateTime(l.scheduled_at) },
  { header: "Confirmação", value: (l) => dateTime(l.confirmed_at) },
  { header: "Comparecimento", value: (l) => dateTime(l.attended_at) },
  { header: "Valor estimado (R$)", value: (l) => decimal(l.estimated_value) },
  { header: "UTM source", value: (l) => text(l.utm_source) },
  { header: "UTM medium", value: (l) => text(l.utm_medium) },
  { header: "UTM campaign", value: (l) => text(l.utm_campaign) },
  { header: "UTM term", value: (l) => text(l.utm_term) },
  { header: "UTM content", value: (l) => text(l.utm_content) },
  { header: "Observações", value: (l) => text(l.notes) },
];

/**
 * Escapa uma célula: aspas quando há separador, aspas ou quebra de linha, e
 * neutraliza fórmulas (=, +, -, @ no início) — leads chegam por webhook e o
 * Excel executaria "=HYPERLINK(...)" (CSV injection).
 */
export function escapeCsvCell(value: string): string {
  let cell = value;
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  if (/[;"\r\n]/.test(cell)) cell = `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

function csvLine(cells: readonly string[]): string {
  return cells.map(escapeCsvCell).join(CSV_DELIMITER);
}

/** Arquivo completo (com BOM): cabeçalho + um lead por linha, em ordem de entrada. */
export function buildLeadsCsv(leads: readonly Lead[]): string {
  const rows = [...leads].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || (a.id < b.id ? -1 : 1),
  );
  const lines = [
    csvLine(LEADS_CSV_COLUMNS.map((c) => c.header)),
    ...rows.map((lead) => csvLine(LEADS_CSV_COLUMNS.map((c) => c.value(lead)))),
  ];
  return CSV_BOM + lines.join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
}

/** relatorio-leads-IDC-2026-03.csv */
export function leadsCsvFileName(monthKey: string): string {
  return `relatorio-leads-IDC-${monthKey}.csv`;
}
