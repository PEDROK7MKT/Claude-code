import { describe, expect, it } from "vitest";

import type { Lead, LeadStatus } from "@/types/database";

import { buildFunnelSteps, funnelProgress, type FunnelStepState } from "./lead-funnel";

type FunnelLead = Pick<Lead, "status" | "created_at" | "contacted_at" | "scheduled_at" | "confirmed_at" | "attended_at">;

const CREATED = "2026-03-01T12:00:00.000Z";
const CONTACTED = "2026-03-01T13:00:00.000Z";
const SCHEDULED = "2026-03-05T12:00:00.000Z";
const CONFIRMED = "2026-03-04T12:00:00.000Z";
const ATTENDED = "2026-03-05T12:30:00.000Z";

function lead(status: LeadStatus, dates: Partial<FunnelLead> = {}): FunnelLead {
  return {
    status,
    created_at: CREATED,
    contacted_at: null,
    scheduled_at: null,
    confirmed_at: null,
    attended_at: null,
    ...dates,
  };
}

const states = (l: FunnelLead): FunnelStepState[] => buildFunnelSteps(l).map((s) => s.state);

describe("buildFunnelSteps", () => {
  it("etapas na ordem da spec", () => {
    expect(buildFunnelSteps(lead("novo")).map((s) => s.label)).toEqual([
      "Entrada",
      "Contato",
      "Agendamento",
      "Confirmação",
      "Comparecimento",
    ]);
  });

  it("novo: entrada concluída e contato como próxima etapa", () => {
    const steps = buildFunnelSteps(lead("novo"));
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
    expect(steps[0].date).toBe(CREATED);
    expect(steps[1].description).toBe("Aguardando contato");
  });

  it("agendado: data da consulta na etapa de agendamento", () => {
    const steps = buildFunnelSteps(lead("agendado", { contacted_at: CONTACTED, scheduled_at: SCHEDULED }));
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "done", "current", "upcoming"]);
    expect(steps[2]).toMatchObject({ date: SCHEDULED, description: "Data da consulta" });
    expect(steps[3].description).toBe("Aguardando confirmação");
  });

  it("confirmado aguarda a consulta", () => {
    const steps = buildFunnelSteps(
      lead("confirmado", { contacted_at: CONTACTED, scheduled_at: SCHEDULED, confirmed_at: CONFIRMED }),
    );
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "done", "done", "current"]);
    expect(steps[4].description).toBe("Aguardando a consulta");
  });

  it("compareceu: funil completo, sem próxima etapa", () => {
    const l = lead("compareceu", {
      contacted_at: CONTACTED,
      scheduled_at: SCHEDULED,
      confirmed_at: CONFIRMED,
      attended_at: ATTENDED,
    });
    expect(states(l)).toEqual(["done", "done", "done", "done", "done"]);
    expect(funnelProgress(buildFunnelSteps(l))).toEqual({ completed: 5, total: 5 });
  });

  it("não compareceu: comparecimento marcado como interrompido", () => {
    const steps = buildFunnelSteps(
      lead("nao_compareceu", { contacted_at: CONTACTED, scheduled_at: SCHEDULED, confirmed_at: CONFIRMED }),
    );
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "done", "done", "missed"]);
    expect(steps[4].description).toBe("Não compareceu");
  });

  it("cancelado depois de agendado: para na confirmação", () => {
    const steps = buildFunnelSteps(lead("cancelado", { contacted_at: CONTACTED, scheduled_at: SCHEDULED }));
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "done", "missed", "upcoming"]);
    expect(steps[3].description).toBe("Consulta cancelada");
  });

  it("perdido sem contato: para no contato", () => {
    const steps = buildFunnelSteps(lead("perdido"));
    expect(steps.map((s) => s.state)).toEqual(["done", "missed", "upcoming", "upcoming", "upcoming"]);
    expect(steps[1].description).toBe("Lead perdido");
    expect(funnelProgress(steps)).toEqual({ completed: 1, total: 5 });
  });

  it("reativado (perdido → em contato): ignora datas de agendamento antigas", () => {
    const steps = buildFunnelSteps(lead("em_contato", { contacted_at: CONTACTED, scheduled_at: SCHEDULED }));
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "current", "upcoming", "upcoming"]);
    expect(steps[2].date).toBeNull();
  });

  it("etapa concluída sem data (lead importado) avisa", () => {
    const steps = buildFunnelSteps(lead("confirmado", { scheduled_at: SCHEDULED }));
    expect(steps[1]).toMatchObject({ state: "done", date: null, description: "Sem data registrada" });
    expect(steps[3]).toMatchObject({ state: "done", date: null, description: "Sem data registrada" });
  });
});
