/**
 * Editor de concorrentes do GMN (spec §4.8 / §7): linhas em edição como texto
 * (aceitando "4,9" e "1.234"), validação e conversão para a lista salva em
 * app_settings.competitors. Funções puras.
 */
import { formatDecimal, formatNumber } from "@/lib/format";
import type { Competitor } from "@/types/database";

export const MAX_COMPETITORS = 20;
export const COMPETITOR_NAME_MAX = 60;
export const MAX_REVIEWS = 1_000_000;

/** Linha em edição (valores como digitados). `id` é só uma chave local estável. */
export interface CompetitorDraft {
  id: string;
  name: string;
  rating: string;
  reviews: string;
}

export type CompetitorField = "name" | "rating" | "reviews";
export type CompetitorDraftErrors = Partial<Record<CompetitorField, string>>;

/** Nomes que representam a própria clínica — o IDC entra no comparativo automaticamente. */
const SELF_NAMES = new Set(["idc", "instituto decio carrilho", "idc instituto decio carrilho"]);

/** Nome para comparação: sem acentos, minúsculo, espaços simples. */
export function normalizeCompetitorName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isSelfName(name: string): boolean {
  return SELF_NAMES.has(normalizeCompetitorName(name));
}

/** Lista salva → linhas editáveis ("4,9", "1.062"). */
export function competitorsToDrafts(list: readonly Competitor[], makeId: (index: number) => string): CompetitorDraft[] {
  return list.map((c, i) => ({
    id: makeId(i),
    name: c.name,
    rating: formatDecimal(c.rating),
    reviews: formatNumber(c.reviews),
  }));
}

/** Texto digitado no formato de exibição (ao sair do campo); inválido fica como está. */
export function formatDraftField(field: Exclude<CompetitorField, "name">, text: string): string {
  if (field === "rating") {
    const rating = parseRatingText(text);
    return rating.ok ? formatDecimal(rating.value) : text;
  }
  const reviews = parseReviewsText(text);
  return reviews.ok ? formatNumber(reviews.value) : text;
}

export function emptyCompetitorDraft(id: string): CompetitorDraft {
  return { id, name: "", rating: "", reviews: "" };
}

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

/** "4,9" / "4.9" / "5" → nota 0–5 com no máximo uma casa decimal. */
export function parseRatingText(text: string): ParseResult {
  const value = text.trim();
  if (!value) return { ok: false, error: "Informe a nota." };
  if (!/^\d+([.,]\d+)?$/.test(value)) return { ok: false, error: "Use um número entre 0 e 5 (ex.: 4,9)." };
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 5) return { ok: false, error: "A nota deve estar entre 0 e 5." };
  // "4,90" é aceito; "4,95" não
  if (Math.abs(Math.round(n * 10) - n * 10) > 1e-9) {
    return { ok: false, error: "Use no máximo uma casa decimal (ex.: 4,9)." };
  }
  return { ok: true, value: Math.round(n * 10) / 10 };
}

/** "304" / "1.234" / "1 234" → inteiro ≥ 0. */
export function parseReviewsText(text: string): ParseResult {
  const value = text.replace(/\s/g, "");
  if (!value) return { ok: false, error: "Informe o nº de avaliações." };
  if (/^-/.test(value)) return { ok: false, error: "Não pode ser negativo." };
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(value)) return { ok: false, error: "Use apenas números inteiros (ex.: 304)." };
  const n = Number(value.replace(/\./g, ""));
  if (n > MAX_REVIEWS) return { ok: false, error: "Valor muito alto." };
  return { ok: true, value: n };
}

export function validateCompetitorName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Informe o nome.";
  if (value.length > COMPETITOR_NAME_MAX) return `Use no máximo ${COMPETITOR_NAME_MAX} caracteres.`;
  if (isSelfName(value)) return "O IDC já entra no comparativo automaticamente.";
  return null;
}

export interface CompetitorValidation {
  /** Lista pronta para salvar (null se houver erros) */
  competitors: Competitor[] | null;
  /** Erros por linha (chave = draft.id) */
  errors: Record<string, CompetitorDraftErrors>;
  /** Erro geral (ex.: limite de concorrentes) */
  formError: string | null;
  errorCount: number;
}

/** Valida todas as linhas (campos, nomes repetidos, limite) e monta a lista final na ordem da tela. */
export function validateCompetitorDrafts(drafts: readonly CompetitorDraft[]): CompetitorValidation {
  const errors: Record<string, CompetitorDraftErrors> = {};
  const competitors: Competitor[] = [];
  const seen = new Set<string>();
  let errorCount = 0;

  for (const draft of drafts) {
    const rowErrors: CompetitorDraftErrors = {};
    const nameError = validateCompetitorName(draft.name);
    const key = normalizeCompetitorName(draft.name);
    if (nameError) rowErrors.name = nameError;
    else if (seen.has(key)) rowErrors.name = "Concorrente repetido.";
    seen.add(key);

    const rating = parseRatingText(draft.rating);
    if (!rating.ok) rowErrors.rating = rating.error;
    const reviews = parseReviewsText(draft.reviews);
    if (!reviews.ok) rowErrors.reviews = reviews.error;

    const count = Object.keys(rowErrors).length;
    if (count > 0) {
      errors[draft.id] = rowErrors;
      errorCount += count;
    } else if (rating.ok && reviews.ok) {
      competitors.push({ name: draft.name.trim().replace(/\s+/g, " "), rating: rating.value, reviews: reviews.value });
    }
  }

  const formError =
    drafts.length > MAX_COMPETITORS ? `Cadastre no máximo ${MAX_COMPETITORS} concorrentes.` : null;
  const valid = errorCount === 0 && !formError;
  return { competitors: valid ? competitors : null, errors, formError, errorCount };
}

/** Move um item de posição (reordenação da lista). Índices fora do limite devolvem a lista inalterada. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function sameCompetitors(a: readonly Competitor[], b: readonly Competitor[]): boolean {
  return (
    a.length === b.length &&
    a.every((c, i) => c.name === b[i].name && c.rating === b[i].rating && c.reviews === b[i].reviews)
  );
}

/** As linhas em edição diferem da lista salva? (linha inválida conta como alteração) */
export function draftsDiffer(drafts: readonly CompetitorDraft[], saved: readonly Competitor[]): boolean {
  if (drafts.length !== saved.length) return true;
  return drafts.some((draft, i) => {
    const rating = parseRatingText(draft.rating);
    const reviews = parseReviewsText(draft.reviews);
    if (!rating.ok || !reviews.ok) return true;
    const c = saved[i];
    return draft.name.trim() !== c.name || rating.value !== c.rating || reviews.value !== c.reviews;
  });
}

export interface CompetitorSummary {
  count: number;
  /** Média simples das notas (null sem concorrentes) */
  averageRating: number | null;
  totalReviews: number;
  /** Concorrente com mais avaliações */
  leader: Competitor | null;
}

export function summarizeCompetitors(list: readonly Competitor[]): CompetitorSummary {
  if (list.length === 0) return { count: 0, averageRating: null, totalReviews: 0, leader: null };
  const totalReviews = list.reduce((sum, c) => sum + c.reviews, 0);
  const averageRating = list.reduce((sum, c) => sum + c.rating, 0) / list.length;
  const leader = list.reduce((best, c) =>
    c.reviews > best.reviews || (c.reviews === best.reviews && c.rating > best.rating) ? c : best,
  );
  return { count: list.length, averageRating, totalReviews, leader };
}

/** "7 concorrentes · média 4,9 ★ · 1.412 avaliações" */
export function describeCompetitorSummary(summary: CompetitorSummary): string {
  if (summary.count === 0) return "Nenhum concorrente cadastrado";
  const count = summary.count === 1 ? "1 concorrente" : `${summary.count} concorrentes`;
  return `${count} · média ${formatDecimal(summary.averageRating)} ★ · ${formatNumber(summary.totalReviews)} avaliações`;
}
