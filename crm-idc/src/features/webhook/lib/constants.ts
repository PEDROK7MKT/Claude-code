/**
 * Webhook de entrada de leads (spec §6.1 — opção A): limites e textos públicos.
 * Documentação para quem integra: docs/WEBHOOK.md.
 */

/** Tamanho máximo do corpo da requisição (bytes). Um lead real ocupa ~1 KB. */
export const MAX_BODY_BYTES = 16 * 1024;

/** Segredo mínimo aceito — gere com `openssl rand -hex 32`. */
export const MIN_SECRET_LENGTH = 16;

/**
 * Valores de exemplo publicados no repositório (.env.example). São públicos: se
 * alguém copiar o exemplo sem trocar, o webhook fica desligado (503) em vez de
 * aceitar qualquer um que conheça o valor.
 */
export const PLACEHOLDER_SECRETS: readonly string[] = ["troque-por-um-valor-aleatorio-longo"];

/** Envios sem segredo (site/navegador): limite por IP. */
export const PUBLIC_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

/**
 * Reenvio do mesmo telefone dentro desta janela (clique duplo, nova tentativa após
 * timeout) devolve o lead já criado em vez de cadastrar outro.
 */
export const REPEAT_WINDOW_MS = 2 * 60_000;

/** Campo "isca" do formulário do site: fica oculto; só robôs o preenchem. */
export const HONEYPOT_FIELD = "website";

/** Nome usado quando uma integração autenticada (ex.: bot) não informa o nome. */
export const UNNAMED_LEAD = "Lead sem nome";

/** Limites de tamanho por campo (o excedente é cortado, não rejeitado). */
export const FIELD_LIMITS = {
  name: 120,
  phone: 40,
  source: 60,
  campaign: 120,
  keyword: 250,
  ad_group: 250,
  landing_page: 500,
  url: 2000,
  utm: 250,
  gclid: 250,
  service: 120,
  service_detail: 200,
  notes: 4000,
  message: 2000,
} as const;

/** Métodos aceitos pela rota (cabeçalho Allow). */
export const ALLOWED_METHODS = "POST, OPTIONS";

/** Mensagens de erro devolvidas no JSON (pt-BR, sem detalhes internos). */
export const WEBHOOK_MESSAGES = {
  notConfigured:
    "Webhook indisponível: o segredo de integração (WEBHOOK_SECRET) não está configurado no servidor do CRM.",
  databaseNotConfigured: "Webhook indisponível: a conexão do CRM com o banco de dados não está configurada.",
  invalidSecret: "Não autorizado: segredo do webhook inválido.",
  missingSecret:
    "Não autorizado: envie o segredo do webhook no cabeçalho \"Authorization: Bearer <segredo>\" ou \"x-webhook-secret\".",
  methodNotAllowed: "Método não permitido. Use POST para enviar um lead.",
  bodyTooLarge: "Requisição muito grande. O limite é de 16 KB por lead.",
  unreadableBody: "Não foi possível ler o corpo da requisição. Envie novamente.",
  emptyBody: "Corpo da requisição vazio. Envie os dados do lead em JSON ou formulário.",
  invalidJson: "JSON inválido. Verifique a sintaxe do corpo da requisição.",
  notAnObject: "O corpo deve ser um objeto com os campos do lead (ex.: {\"name\": \"...\", \"phone\": \"...\"}).",
  unsupportedMediaType:
    "Formato não suportado. Envie Content-Type \"application/json\" ou \"application/x-www-form-urlencoded\".",
  validation: "Dados inválidos. Corrija os campos indicados e envie novamente.",
  internal: "Erro interno ao registrar o lead. Tente novamente em instantes.",
  rateLimited: (seconds: number) =>
    `Muitas tentativas em pouco tempo. Aguarde ${seconds} ${seconds === 1 ? "segundo" : "segundos"} e tente novamente.`,
} as const;

/** Erros de campo (pt-BR). */
export const FIELD_MESSAGES = {
  phoneRequired: "Informe o telefone (WhatsApp) com DDD.",
  phoneInvalid: "Telefone inválido. Informe DDD + número, ex.: (77) 98765-4321.",
  nameRequired: "Informe o nome do paciente.",
  notText: "Deve ser um texto.",
} as const;
