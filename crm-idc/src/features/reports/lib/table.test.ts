import { describe, expect, it } from "vitest";
import {
  DEFAULT_REPORT_SORT,
  isStaleAppointment,
  pageWindow,
  paginate,
  reportTableTotals,
  sortReportLeads,
  toggleSort,
} from "./table";
import { makeLead } from "./test-fixtures";

const ana = makeLead({ name: "Ana", source: "instagram", service: "implante", status: "compareceu", created_at: "2026-03-02T15:00:00.000Z", scheduled_at: "2026-03-10T12:00:00.000Z" });
const alvaro = makeLead({ name: "Álvaro", source: "google_ads", service: null, status: "novo", created_at: "2026-03-05T15:00:00.000Z" });
const bruno = makeLead({ name: "bruno", source: "gmn", service: "canal", status: "agendado", created_at: "2026-03-04T15:00:00.000Z", scheduled_at: "2026-03-20T12:00:00.000Z" });
const carla = makeLead({ name: "Carla", source: "google_ads", service: "clareamento", status: "perdido", created_at: "2026-03-03T15:00:00.000Z", scheduled_at: "2026-03-18T12:00:00.000Z" });
const leads = [ana, alvaro, bruno, carla];

const names = (rows: ReadonlyArray<{ name: string }>) => rows.map((r) => r.name);

describe("sortReportLeads", () => {
  it("padrão: entrada mais recente primeiro, sem alterar o array original", () => {
    const copy = [...leads];
    expect(names(sortReportLeads(leads, DEFAULT_REPORT_SORT))).toEqual(["Álvaro", "bruno", "Carla", "Ana"]);
    expect(leads).toEqual(copy);
  });

  it("nome em ordem alfabética pt-BR (acentos e maiúsculas não importam)", () => {
    expect(names(sortReportLeads(leads, { key: "name", dir: "asc" }))).toEqual(["Álvaro", "Ana", "bruno", "Carla"]);
    expect(names(sortReportLeads(leads, { key: "name", dir: "desc" }))).toEqual(["Carla", "bruno", "Ana", "Álvaro"]);
  });

  it("status segue a ordem do funil", () => {
    expect(names(sortReportLeads(leads, { key: "status", dir: "asc" }))).toEqual(["Álvaro", "bruno", "Ana", "Carla"]);
  });

  it("fonte pelo rótulo e serviço vazio sempre no fim", () => {
    expect(names(sortReportLeads(leads, { key: "source", dir: "asc" }))).toEqual(["Álvaro", "Carla", "bruno", "Ana"]);
    expect(names(sortReportLeads(leads, { key: "service", dir: "asc" }))).toEqual(["Carla", "Ana", "bruno", "Álvaro"]);
    expect(names(sortReportLeads(leads, { key: "service", dir: "desc" })).at(-1)).toBe("Álvaro");
  });

  it("agendamento: sem data fica no fim nos dois sentidos", () => {
    expect(names(sortReportLeads(leads, { key: "scheduled_at", dir: "asc" }))).toEqual(["Ana", "Carla", "bruno", "Álvaro"]);
    expect(names(sortReportLeads(leads, { key: "scheduled_at", dir: "desc" }))).toEqual(["bruno", "Carla", "Ana", "Álvaro"]);
  });
});

describe("toggleSort", () => {
  it("inverte a mesma coluna e usa a direção inicial numa nova", () => {
    expect(toggleSort({ key: "name", dir: "asc" }, "name")).toEqual({ key: "name", dir: "desc" });
    expect(toggleSort({ key: "name", dir: "desc" }, "created_at")).toEqual({ key: "created_at", dir: "desc" });
    expect(toggleSort(DEFAULT_REPORT_SORT, "status")).toEqual({ key: "status", dir: "asc" });
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 53 }, (_, i) => i + 1);

  it("fatia a página pedida", () => {
    expect(paginate(items, 2, 25)).toMatchObject({ page: 2, pageCount: 3, from: 26, to: 50 });
    expect(paginate(items, 3, 25).rows).toEqual([51, 52, 53]);
  });

  it("limita a página ao intervalo válido", () => {
    expect(paginate(items, 9, 25).page).toBe(3);
    expect(paginate(items, 0, 25).page).toBe(1);
    expect(paginate([], 1, 25)).toEqual({ rows: [], page: 1, pageCount: 1, from: 0, to: 0 });
  });
});

describe("reportTableTotals", () => {
  it("soma leads, agendamentos, consultas, fontes e serviços", () => {
    expect(reportTableTotals(leads)).toEqual({
      leads: 4,
      scheduled: 2,
      attended: 1,
      withAppointment: 2,
      sources: 3,
      services: 3,
      googleAds: 2,
    });
  });
});

describe("isStaleAppointment", () => {
  it("consulta de lead perdido/cancelado não vale mais", () => {
    expect(isStaleAppointment(carla)).toBe(true);
    expect(isStaleAppointment(bruno)).toBe(false);
    expect(isStaleAppointment(alvaro)).toBe(false);
  });
});

describe("pageWindow", () => {
  it("mostra todas as páginas até 7", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("resume com reticências quando há muitas páginas", () => {
    expect(pageWindow(1, 12)).toEqual([1, 2, 3, 4, "ellipsis", 12]);
    expect(pageWindow(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
    expect(pageWindow(12, 12)).toEqual([1, "ellipsis", 9, 10, 11, 12]);
  });
});
