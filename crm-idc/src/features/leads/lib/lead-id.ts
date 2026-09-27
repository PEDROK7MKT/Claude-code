/**
 * /leads/[id]: o id do lead é UUID (gen_random_uuid / crypto.randomUUID). Ids em
 * outro formato viram 404 direto no servidor, sem consultar o banco (o PostgREST
 * responderia erro de sintaxe de uuid em vez de "não encontrado").
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLeadId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
