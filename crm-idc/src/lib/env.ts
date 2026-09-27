/**
 * Variáveis de ambiente públicas (disponíveis no navegador).
 * Referências literais a process.env.NEXT_PUBLIC_* são obrigatórias para o
 * Next.js embutir os valores no bundle do cliente.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
