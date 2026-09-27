/**
 * Importação de métricas do Google Ads via CSV (spec §4.5).
 *
 * Aceita o relatório exportado do Google Ads (pt-BR ou inglês) e planilhas feitas à mão:
 * - codificação UTF-8 (com/sem BOM), UTF-16 (exportação "Excel" do Google Ads) ou Windows-1252;
 * - separador ";" , "," ou tabulação, detectado automaticamente;
 * - linhas de título antes do cabeçalho, linhas "Total: ..." no fim e linhas em branco;
 * - cabeçalhos em português/inglês sem diferenciar maiúsculas/acentos
 *   (Dia/Data/Date, Campanha/Campaign, Impr./Impressões, Cliques/Clicks, Custo/Cost, Conversões/Conv.);
 * - arquivo sem cabeçalho na ordem da spec: data, campanha, impressões, cliques, custo, conversões;
 * - datas dd/MM/yyyy, yyyy-MM-dd, "1 de set. de 2026", "Sep 1, 2026";
 * - números "1.234,56", "1,234.56", "R$ 12,00", "--" (vazio = 0).
 * Funções puras (sem DOM) — testadas em csv.test.ts.
 */
import Papa from "papaparse";
import {
  dailyMetricKey,
  parseDateKey,
  sanitizeDailyMetric,
  type DailyMetricInput,
} from "@/features/google-ads/api/daily-metrics-utils";
import { CAMPAIGNS } from "@/lib/constants";
import { formatDateKey } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { formatNumber, parseBRNumber } from "@/lib/format";
import { matchKnownCampaign } from "./campaigns";
import { MAX_COST, MAX_INTEGER } from "./metric-form";

export type CsvField = "date" | "campaign" | "impressions" | "clicks" | "cost" | "conversions";
export type CsvDelimiter = ";" | "," | "\t";
export type NumberFormat = "br" | "en";

/** Ordem da spec (também usada em arquivos sem cabeçalho). */
export const CSV_FIELDS: readonly CsvField[] = ["date", "campaign", "impressions", "clicks", "cost", "conversions"];
const METRIC_FIELDS = ["impressions", "clicks", "cost", "conversions"] as const;
type MetricField = (typeof METRIC_FIELDS)[number];

export const CSV_FIELD_LABEL: Record<CsvField, string> = {
  date: "Data",
  campaign: "Campanha",
  impressions: "Impressões",
  clicks: "Cliques",
  cost: "Custo",
  conversions: "Conversões",
};

/** Cabeçalhos aceitos (já normalizados por `normalizeHeader`). */
const HEADER_ALIASES: Record<CsvField, readonly string[]> = {
  date: ["dia", "data", "date", "day"],
  campaign: ["campanha", "campaign", "nome da campanha", "campaign name"],
  impressions: ["impr", "impressoes", "impressao", "impressions", "impression"],
  clicks: ["cliques", "clique", "clicks", "click"],
  cost: ["custo", "cost", "gasto", "gastos", "investimento", "valor gasto", "spend", "amount spent"],
  conversions: ["conversoes", "conversao", "conversions", "conversion", "conv"],
};

/** Colunas de período que indicam relatório não segmentado por dia. */
const PERIOD_HEADERS = ["semana", "week", "mes", "month", "trimestre", "quarter", "ano", "year"];

export const MAX_IMPORT_ROWS = 5000;

export interface CsvPreviewRow {
  /** Número da linha no arquivo (1-based) */
  line: number;
  /** yyyy-MM-dd quando válida */
  date: string | null;
  /** Texto original da data (para mostrar quando inválida) */
  rawDate: string;
  campaign: string | null;
  impressions: number | null;
  clicks: number | null;
  cost: number | null;
  conversions: number | null;
  /** valid: será importada · invalid: tem erro · duplicate: repetida no arquivo (vale a última) */
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
  warnings: string[];
  /** Campos com erro (para destacar a célula na prévia) */
  invalidFields: CsvField[];
  /** Já existe lançamento para o dia/campanha (o import atualiza) */
  replacesExisting: boolean;
}

export interface CsvParseResult {
  /** Erro que impede o import do arquivo inteiro (null = arquivo lido) */
  error: string | null;
  delimiter: CsvDelimiter;
  numberFormat: NumberFormat;
  hasHeader: boolean;
  /** Índice da coluna de cada campo reconhecido */
  columns: Partial<Record<CsvField, number>>;
  /** Colunas de métrica ausentes no arquivo (gravadas como 0) */
  missingColumns: CsvField[];
  /** Arquivo sem coluna de campanha: é preciso escolher uma campanha para todas as linhas */
  campaignColumnMissing: boolean;
  rows: CsvPreviewRow[];
  skipped: { totals: number; blank: number; notes: number };
  counts: { valid: number; invalid: number; duplicate: number; replacing: number };
}

export interface ParseCsvOptions {
  /** Hoje (yyyy-MM-dd, fuso da clínica) — datas futuras são rejeitadas */
  todayKey?: string;
  /** Campanha usada quando o arquivo não tem a coluna (ou a célula está vazia) */
  defaultCampaign?: string | null;
  /** Campanhas já existentes: nomes iguais ignorando maiúsculas usam a grafia existente */
  knownCampaigns?: readonly string[];
  /** Chaves `dailyMetricKey` já gravadas no banco */
  existingKeys?: ReadonlySet<string>;
  maxRows?: number;
}

// -----------------------------------------------------------------------------
// Decodificação e utilidades
// -----------------------------------------------------------------------------

/** Converte os bytes do arquivo em texto detectando BOM, UTF-16 sem BOM e Windows-1252. */
export function decodeCsvBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }
  // UTF-16LE sem BOM: texto ASCII com um byte nulo depois de cada caractere
  const sample = bytes.subarray(0, 200);
  let oddZeros = 0;
  for (let i = 1; i < sample.length; i += 2) if (sample[i] === 0) oddZeros++;
  if (sample.length >= 4 && oddZeros >= sample.length / 4) return new TextDecoder("utf-16le").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // Excel em pt-BR salva CSV em ANSI (Windows-1252)
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Minúsculo, sem acentos/pontuação/moeda: "Impr." → "impr", "Custo (BRL)" → "custo". */
export function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/r\$/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+(brl|usd|eur|reais)$/, "")
    .trim();
}

/** Conta campos de uma linha respeitando aspas. */
function countFields(line: string, delimiter: string): number {
  let count = 1;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delimiter && !inQuotes) count++;
  }
  return count;
}

/**
 * Separador mais provável: o que divide o maior número de linhas na mesma
 * quantidade de campos (>1). Empate → o que gera mais colunas. Padrão ";".
 */
export function detectDelimiter(text: string): CsvDelimiter {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim())
    .slice(0, 40);
  let best: CsvDelimiter = ";";
  let bestScore = 0;
  for (const delimiter of [";", "\t", ","] as const) {
    const freq = new Map<number, number>();
    for (const line of lines) {
      const fields = countFields(line, delimiter);
      if (fields > 1) freq.set(fields, (freq.get(fields) ?? 0) + 1);
    }
    let score = 0;
    for (const [fields, n] of freq) score = Math.max(score, n * 1000 + fields);
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }
  return best;
}

/** Remove moeda, espaços (inclusive não separáveis) e aspas de uma célula numérica. */
function cleanNumberCell(raw: string): string {
  return raw
    .replace(/["'\s\u00a0\u202f]/g, "")
    .replace(/^(R\$|US\$|\$|BRL|USD)/i, "")
    .replace(/(BRL|USD)$/i, "")
    .replace(/%$/, "");
}

function isEmptyNumber(cell: string): boolean {
  return cell === "" || /^[-–—]{1,2}$/.test(cell);
}

/**
 * Formato numérico do arquivo, pelas células de métrica: vírgula decimal (pt-BR)
 * ou ponto decimal (inglês). Na dúvida, pt-BR.
 */
export function detectNumberFormat(cells: readonly string[]): NumberFormat {
  let br = 0;
  let en = 0;
  for (const raw of cells) {
    const s = cleanNumberCell(raw);
    if (isEmptyNumber(s)) continue;
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s) || /^-?\d+,\d{1,2}$/.test(s)) br += 2;
    else if (/^-?\d{1,3}(,\d{3})+\.\d+$/.test(s) || /^-?\d+\.\d{1,2}$/.test(s)) en += 2;
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) br += 1;
    else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) en += 1;
  }
  return en > br ? "en" : "br";
}

/**
 * Número de uma célula. Vazio/"--" → 0 (Google Ads usa "--" para "sem dados").
 * Retorna null quando o texto não é número.
 */
export function parseCsvNumber(raw: string, format: NumberFormat): number | null {
  const s = cleanNumberCell(raw);
  if (isEmptyNumber(s)) return 0;
  // (12,00) = negativo em planilhas contábeis
  const negative = /^\(.*\)$/.test(s);
  const body = negative ? s.slice(1, -1) : s;
  if (!/^[-+]?[\d.,]+$/.test(body)) return null;
  let n: number | null;
  if (format === "en") {
    n = /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(body) || !body.includes(",") ? Number(body.replace(/,/g, "")) : parseBRNumber(body);
  } else {
    n = parseBRNumber(body);
  }
  if (n === null || !Number.isFinite(n)) return null;
  return negative ? -n : n;
}

const MONTHS_PT: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};
const MONTHS_EN: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function toKey(y: number, m: number | undefined, d: number): string | null {
  if (!m) return null;
  return parseDateKey(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
}

/**
 * Data de uma célula → yyyy-MM-dd. Aceita os formatos de parseDateKey (yyyy-MM-dd,
 * dd/MM/yyyy...), yyyy/MM/dd, dd/MM/yy e nomes de mês ("1 de set. de 2026",
 * "seg., 1 de setembro de 2026", "Sep 1, 2026", "Mon, Sep 1, 2026").
 */
export function parseCsvDate(raw: string): string | null {
  const value = raw
    .trim()
    .replace(/^"|"$/g, "")
    .trim()
    // "01/09/2026 00:00" (Excel) → só a data
    .replace(/^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\s+\d{1,2}:\d{2}(?::\d{2})?$/, "$1");
  if (!value) return null;
  const direct = parseDateKey(value);
  if (direct) return direct;

  let match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value);
  if (match) return toKey(Number(match[1]), Number(match[2]), Number(match[3]));

  match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/.exec(value);
  if (match) return toKey(2000 + Number(match[3]), Number(match[2]), Number(match[1]));

  const text = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // dia antes do mês (pt-BR): "1 de set de 2026"
  match = /(\d{1,2}) (?:de )?([a-z]{3})[a-z]* (?:de )?(\d{4})/.exec(text);
  if (match) {
    const month = MONTHS_PT[match[2]] ?? MONTHS_EN[match[2]];
    return toKey(Number(match[3]), month, Number(match[1]));
  }
  // mês antes do dia (inglês): "sep 1 2026"
  match = /([a-z]{3})[a-z]* (\d{1,2}) (\d{4})/.exec(text);
  if (match) {
    const month = MONTHS_EN[match[1]] ?? MONTHS_PT[match[1]];
    return toKey(Number(match[3]), month, Number(match[2]));
  }
  return null;
}

// -----------------------------------------------------------------------------
// Cabeçalho
// -----------------------------------------------------------------------------

/** Mapeia colunas de um cabeçalho. A primeira coluna de cada campo vence. */
export function mapHeader(cells: readonly string[]): Partial<Record<CsvField, number>> {
  const columns: Partial<Record<CsvField, number>> = {};
  cells.forEach((cell, index) => {
    const name = normalizeHeader(cell);
    if (!name) return;
    for (const field of CSV_FIELDS) {
      if (columns[field] === undefined && HEADER_ALIASES[field].includes(name)) {
        columns[field] = index;
        return;
      }
    }
  });
  return columns;
}

function isHeaderRow(columns: Partial<Record<CsvField, number>>): boolean {
  const recognized = Object.keys(columns).length;
  return recognized >= 2 && (columns.date !== undefined || columns.campaign !== undefined);
}

const isBlank = (cells: readonly string[]) => cells.every((c) => !c.trim());

/** Linhas de total do Google Ads ("Total: conta", "Total: campanhas", "Total - Account"). */
function isTotalRow(cells: readonly string[], dateIndex: number | undefined): boolean {
  const hasDate = dateIndex !== undefined && parseCsvDate(cells[dateIndex] ?? "") !== null;
  if (hasDate) return false;
  return cells.slice(0, 4).some((c) => /^total\b/.test(normalizeHeader(c)));
}

// -----------------------------------------------------------------------------
// Parser principal
// -----------------------------------------------------------------------------

const EMPTY_RESULT = (delimiter: CsvDelimiter, error: string): CsvParseResult => ({
  error,
  delimiter,
  numberFormat: "br",
  hasHeader: false,
  columns: {},
  missingColumns: [],
  campaignColumnMissing: false,
  rows: [],
  skipped: { totals: 0, blank: 0, notes: 0 },
  counts: { valid: 0, invalid: 0, duplicate: 0, replacing: 0 },
});

const EXPECTED_COLUMNS = "data, campanha, impressões, cliques, custo e conversões";

export function parseGoogleAdsCsv(input: string, options: ParseCsvOptions = {}): CsvParseResult {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  if (!text.trim()) return EMPTY_RESULT(delimiter, "O arquivo está vazio.");

  const parsed = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: false });
  const records = parsed.data.map((row) => row.map((cell) => (cell ?? "").replace(/^\uFEFF/, "")));

  // 1) Localiza o cabeçalho (pode haver título/período antes) ou a 1ª linha de dados sem cabeçalho
  let startIndex = -1;
  let hasHeader = false;
  let columns: Partial<Record<CsvField, number>> = {};
  for (let i = 0; i < Math.min(records.length, 30); i++) {
    const cells = records[i];
    if (isBlank(cells)) continue;
    const mapped = mapHeader(cells);
    if (isHeaderRow(mapped)) {
      startIndex = i + 1;
      hasHeader = true;
      columns = mapped;
      break;
    }
    if (cells.length >= 2 && parseCsvDate(cells[0]) !== null) {
      startIndex = i;
      CSV_FIELDS.forEach((field, index) => {
        if (index < cells.length) columns[field] = index;
      });
      break;
    }
  }

  if (startIndex < 0) {
    const periodHeader = records
      .slice(0, 30)
      .some((cells) => cells.some((c) => PERIOD_HEADERS.includes(normalizeHeader(c))));
    return EMPTY_RESULT(
      delimiter,
      periodHeader
        ? "O relatório precisa estar segmentado por dia (coluna “Dia”). No Google Ads, use Segmentar → Tempo → Dia antes de baixar."
        : `Não encontramos o cabeçalho. O arquivo deve ter as colunas ${EXPECTED_COLUMNS}.`,
    );
  }
  if (columns.date === undefined) {
    const periodHeader = records[startIndex - 1]?.some((c) => PERIOD_HEADERS.includes(normalizeHeader(c)));
    return EMPTY_RESULT(
      delimiter,
      periodHeader
        ? "O relatório precisa estar segmentado por dia (coluna “Dia”). No Google Ads, use Segmentar → Tempo → Dia antes de baixar."
        : "Coluna de data não encontrada (Dia, Data ou Date).",
    );
  }
  if (!METRIC_FIELDS.some((field) => columns[field] !== undefined)) {
    return EMPTY_RESULT(delimiter, `Nenhuma coluna de métrica encontrada. Use as colunas ${EXPECTED_COLUMNS}.`);
  }

  const body = records.slice(startIndex).map((cells, i) => ({ cells, line: startIndex + i + 1 }));
  const dataLines = body.filter(({ cells }) => !isBlank(cells));
  const maxRows = options.maxRows ?? MAX_IMPORT_ROWS;
  if (dataLines.length > maxRows + 10) {
    return EMPTY_RESULT(
      delimiter,
      `O arquivo tem mais de ${formatNumber(maxRows)} linhas. Divida em arquivos menores (ex.: um por mês).`,
    );
  }

  // 2) Formato dos números pelo conjunto das células de métrica
  const numberCells: string[] = [];
  for (const { cells } of dataLines) {
    for (const field of METRIC_FIELDS) {
      const index = columns[field];
      if (index !== undefined && cells[index] !== undefined) numberCells.push(cells[index]);
    }
  }
  const numberFormat = detectNumberFormat(numberCells);

  const missingColumns = METRIC_FIELDS.filter((field) => columns[field] === undefined);
  const campaignColumnMissing = columns.campaign === undefined;
  const defaultCampaign = options.defaultCampaign?.trim() || null;
  const known = options.knownCampaigns ?? [];

  // 3) Linhas
  const skipped = { totals: 0, blank: 0, notes: 0 };
  const rows: CsvPreviewRow[] = [];
  for (const { cells, line } of body) {
    if (isBlank(cells)) {
      skipped.blank++;
      continue;
    }
    if (isTotalRow(cells, columns.date)) {
      skipped.totals++;
      continue;
    }
    const rawDate = (cells[columns.date] ?? "").trim();
    const date = parseCsvDate(rawDate);
    // Notas/rodapés: uma única célula preenchida que não é data
    if (!date && cells.filter((c) => c.trim()).length <= 1) {
      skipped.notes++;
      continue;
    }
    rows.push(buildRow({ cells, line, rawDate, date, columns, numberFormat, defaultCampaign, known, options }));
  }

  if (!rows.length) {
    return {
      ...EMPTY_RESULT(delimiter, "Nenhuma linha de métrica encontrada no arquivo."),
      numberFormat,
      hasHeader,
      columns,
      skipped,
    };
  }
  if (rows.length > maxRows) {
    return EMPTY_RESULT(
      delimiter,
      `O arquivo tem mais de ${formatNumber(maxRows)} linhas. Divida em arquivos menores (ex.: um por mês).`,
    );
  }

  markDuplicates(rows);

  const counts = { valid: 0, invalid: 0, duplicate: 0, replacing: 0 };
  for (const row of rows) {
    counts[row.status]++;
    if (row.status === "valid" && row.replacesExisting) counts.replacing++;
  }

  return {
    error: null,
    delimiter,
    numberFormat,
    hasHeader,
    columns,
    missingColumns,
    campaignColumnMissing,
    rows,
    skipped,
    counts,
  };
}

interface BuildRowArgs {
  cells: string[];
  line: number;
  rawDate: string;
  date: string | null;
  columns: Partial<Record<CsvField, number>>;
  numberFormat: NumberFormat;
  defaultCampaign: string | null;
  known: readonly string[];
  options: ParseCsvOptions;
}

function buildRow({
  cells,
  line,
  rawDate,
  date,
  columns,
  numberFormat,
  defaultCampaign,
  known,
  options,
}: BuildRowArgs): CsvPreviewRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const invalidFields = new Set<CsvField>();
  const fail = (field: CsvField, message: string) => {
    errors.push(message);
    invalidFields.add(field);
  };

  if (!rawDate) fail("date", "Data não informada.");
  else if (!date) fail("date", `Data inválida: “${rawDate}”. Use dd/mm/aaaa ou aaaa-mm-dd.`);
  else if (options.todayKey && date > options.todayKey) fail("date", `Data no futuro: ${formatDateKey(date)}.`);

  const campaignCell = columns.campaign !== undefined ? (cells[columns.campaign] ?? "").trim() : "";
  const campaignText = campaignCell || defaultCampaign;
  const campaign = campaignText ? matchKnownCampaign(campaignText, known) : null;
  if (!campaign) fail("campaign", columns.campaign === undefined ? "Escolha a campanha do arquivo." : "Campanha não informada.");
  else if (campaign.length > 120) fail("campaign", "Nome da campanha muito longo (máx. 120 caracteres).");

  const values: Record<MetricField, number | null> = { impressions: 0, clicks: 0, cost: 0, conversions: 0 };
  for (const field of METRIC_FIELDS) {
    const index = columns[field];
    if (index === undefined) continue;
    const raw = (cells[index] ?? "").trim();
    const n = parseCsvNumber(raw, numberFormat);
    const label = CSV_FIELD_LABEL[field];
    if (n === null) {
      fail(field, `${label}: valor inválido “${raw}”.`);
      values[field] = null;
    } else if (n < 0) {
      fail(field, `${label}: o valor não pode ser negativo.`);
      values[field] = n;
    } else if ((field === "impressions" || field === "clicks") && !Number.isInteger(n)) {
      fail(field, `${label}: deve ser um número inteiro (“${raw}”).`);
      values[field] = n;
    } else if (n > (field === "cost" ? MAX_COST : MAX_INTEGER)) {
      fail(field, `${label}: valor acima do permitido.`);
      values[field] = n;
    } else {
      values[field] = field === "cost" ? Math.round(n * 100) / 100 : n;
    }
  }

  const conversions = values.conversions;
  if (conversions !== null && conversions >= 0 && !Number.isInteger(conversions)) {
    const rounded = Math.round(conversions);
    warnings.push(`Conversões fracionadas (${formatNumber(conversions)}) serão gravadas como ${formatNumber(rounded)}.`);
    values.conversions = rounded;
  }
  if (values.clicks !== null && values.impressions !== null && values.clicks > values.impressions && columns.impressions !== undefined) {
    warnings.push("Há mais cliques do que impressões.");
  }

  // Validação final idêntica à do gravador (mesmas regras do banco)
  if (!errors.length && date && campaign) {
    try {
      sanitizeDailyMetric({ date, campaign, ...values });
    } catch (err) {
      errors.push(getErrorMessage(err));
    }
  }

  const replacesExisting =
    !errors.length && !!date && !!campaign && !!options.existingKeys?.has(dailyMetricKey({ date, campaign }));
  if (replacesExisting) warnings.push("Já existe lançamento para este dia e campanha — os valores serão atualizados.");

  return {
    line,
    date,
    rawDate,
    campaign,
    ...values,
    status: errors.length ? "invalid" : "valid",
    errors,
    warnings,
    invalidFields: [...invalidFields],
    replacesExisting,
  };
}

/** Mesma data e campanha repetidas no arquivo: vale a última (as anteriores ficam de fora). */
function markDuplicates(rows: CsvPreviewRow[]): void {
  const lastByKey = new Map<string, CsvPreviewRow>();
  for (const row of rows) {
    if (row.status !== "valid" || !row.date || !row.campaign) continue;
    lastByKey.set(dailyMetricKey({ date: row.date, campaign: row.campaign }), row);
  }
  for (const row of rows) {
    if (row.status !== "valid" || !row.date || !row.campaign) continue;
    const last = lastByKey.get(dailyMetricKey({ date: row.date, campaign: row.campaign }));
    if (last && last !== row) {
      row.status = "duplicate";
      row.warnings.push(`Repetida na linha ${last.line} (mesma data e campanha) — vale a última.`);
    }
  }
}

/** Linhas válidas no formato do hook useImportDailyMetrics. */
export function toImportInputs(result: CsvParseResult): DailyMetricInput[] {
  return result.rows
    .filter((row) => row.status === "valid" && row.date && row.campaign)
    .map((row) => ({
      date: row.date as string,
      campaign: row.campaign as string,
      impressions: row.impressions,
      clicks: row.clicks,
      cost: row.cost,
      conversions: row.conversions,
    }));
}

// -----------------------------------------------------------------------------
// Modelo para download
// -----------------------------------------------------------------------------

export const CSV_TEMPLATE_FILENAME = "modelo-metricas-google-ads.csv";

/**
 * Modelo CSV (pt-BR: separador ";" e vírgula decimal, abre certo no Excel), com uma
 * linha de exemplo por campanha. `sampleDateKey` = data dos exemplos (yyyy-MM-dd).
 * Sem BOM — quem baixa adiciona.
 */
export function buildCsvTemplate(sampleDateKey: string, campaigns: readonly string[] = CAMPAIGNS.map((c) => c.label)): string {
  const date = formatDateKey(sampleDateKey);
  const samples = [
    ["1.250", "84", "312,50", "6"],
    ["980", "41", "205,90", "3"],
  ];
  const names = campaigns.length ? campaigns.slice(0, samples.length) : CAMPAIGNS.map((c) => c.label);
  return Papa.unparse(
    {
      fields: ["data", "campanha", "impressões", "cliques", "custo", "conversões"],
      data: names.map((name, i) => [date, name, ...samples[i]]),
    },
    { delimiter: ";", newline: "\r\n" },
  );
}
