import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DailyMetric, Lead } from "@/types/database";

const state = vi.hoisted(() => ({ isAdmin: true, metrics: [] as unknown[], leads: [] as unknown[], leadsError: false }));

vi.mock("@/features/auth/session-context", () => ({ useSession: () => ({ isAdmin: state.isAdmin }) }));
vi.mock("@/features/google-ads/api/daily-metrics", () => {
  const mutation = { mutateAsync: vi.fn(), isPending: false };
  return {
    useDailyMetrics: () => ({ data: state.metrics, isPending: false, isError: false, isFetching: false, refetch: vi.fn() }),
    useDeleteDailyMetric: () => mutation,
    useUpsertDailyMetric: () => mutation,
    useImportDailyMetrics: () => mutation,
  };
});
vi.mock("@/features/leads/api/leads-queries", () => ({
  useLeads: () =>
    state.leadsError
      ? { data: undefined, isPending: false, isError: true, isFetching: false, refetch: vi.fn() }
      : { data: state.leads, isPending: false, isError: false, isFetching: false, refetch: vi.fn() },
}));

import { GoogleAdsView } from "@/features/google-ads/components/google-ads-view";
import { todayKey } from "@/lib/dates";
import { addDaysToKey } from "@/features/google-ads/lib/periods";
import { startOfDateKey } from "@/lib/dates";

function makeMetrics(days: number): DailyMetric[] {
  const today = todayKey();
  const out: DailyMetric[] = [];
  for (let i = 0; i < days; i++) {
    if (i % 9 === 4) continue; // lacunas
    const date = addDaysToKey(today, -i);
    for (const campaign of ["IDC | Urgência e Canal", "IDC | Implante Dentário"]) {
      const impressions = 800 + ((i * 37) % 400);
      const clicks = 30 + ((i * 7) % 25);
      out.push({
        id: `${date}-${campaign}`,
        date,
        campaign,
        impressions,
        clicks,
        cost: Math.round((clicks * 2.7 + (i % 5)) * 100) / 100,
        conversions: (i * 3) % 5,
        leads_total: (i * 5) % 4,
        leads_agendados: (i * 5) % 2,
        created_by: null,
        created_at: "",
        updated_at: "",
      });
    }
  }
  return out;
}

function makeLeads(days: number): Partial<Lead>[] {
  const today = todayKey();
  const leads: Partial<Lead>[] = [];
  for (let i = 0; i < days; i++) {
    const n = (i * 5) % 4;
    for (let j = 0; j < n; j++) {
      leads.push({
        id: `l-${i}-${j}`,
        created_at: new Date(startOfDateKey(addDaysToKey(today, -i)).getTime() + (10 + j) * 3600_000).toISOString(),
        source: "google_ads",
        status: j % 2 ? "agendado" : "novo",
        campaign: j === 2 ? null : "IDC | Urgência e Canal",
      });
    }
  }
  return leads;
}

function render(): string {
  const client = new QueryClient();
  const errors: unknown[] = [];
  const spy = vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args));
  const html = renderToString(
    <QueryClientProvider client={client}>
      <GoogleAdsView />
    </QueryClientProvider>,
  );
  spy.mockRestore();
  if (errors.length) console.log("console.error:", JSON.stringify(errors).slice(0, 2000));
  return html.replace(/<!-- -->/g, "");
}

describe("GoogleAdsView (SSR smoke)", () => {
  it("empty state (admin)", () => {
    state.metrics = [];
    const html = render();
    expect(html).toContain("Lançar primeiro dia");
    expect(html).toContain("Importar CSV");
  });

  it("empty state (dentista) sem CTAs", () => {
    state.isAdmin = false;
    const html = render();
    expect(html).not.toContain("Lançar primeiro dia");
    expect(html).toContain("Modo leitura");
    state.isAdmin = true;
  });

  it("página completa com dados", () => {
    state.metrics = makeMetrics(60);
    state.leads = makeLeads(60);
    const html = render();
    for (const text of ["CPL real", "Custo por agendamento real", "Leads reais no CRM", "Investimento", "Impressões", "CTR", "CPC médio", "Conversões (Google Ads)", "Histórico de lançamentos", "Por campanha", "Conversões Google Ads × Leads reais no CRM"]) {
      expect(html, text).toContain(text);
    }
    const paths = html.match(/<path/g)?.length ?? 0;
    const rects = html.match(/recharts-rectangle/g)?.length ?? 0;
    console.log("svg paths:", paths, "bars:", rects, "html KB:", Math.round(html.length / 1024));
    console.log("kpi values:", [...html.matchAll(/text-3xl[^>]*>([^<]*)</g)].map((m) => m[1]));
    console.log("tiles:", [...html.matchAll(/sm:text-xl">([^<]*)</g)].map((m) => m[1]));
    expect(html).toContain("Mostrando 1–20");
  });

  it("dentista: sem ações de edição", () => {
    state.isAdmin = false;
    const html = render();
    expect(html).not.toContain("Editar lançamento");
    expect(html).not.toContain("Lançar dia");
    state.isAdmin = true;
  });

  it("erro nos leads", () => {
    state.leadsError = true;
    const html = render();
    expect(html).toContain("Não foi possível carregar os leads do CRM");
    state.leadsError = false;
  });
});
