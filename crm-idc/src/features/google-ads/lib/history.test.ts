import { describe, expect, it } from "vitest";
import { paginate, pageWindow, rowCpl, rowCtr, sortHistory, toggleSort } from "./history";

const rows = [
  { id: "1", date: "2026-09-01", campaign: "B", cost: 50 },
  { id: "2", date: "2026-09-03", campaign: "A", cost: 10 },
  { id: "3", date: "2026-09-01", campaign: "A", cost: 90 },
  { id: "4", date: "2026-09-02", campaign: "A", cost: 50 },
];

describe("sortHistory", () => {
  it("por data desc com desempate por campanha", () => {
    expect(sortHistory(rows, { key: "date", direction: "desc" }).map((r) => r.id)).toEqual(["2", "4", "3", "1"]);
  });

  it("por data asc", () => {
    expect(sortHistory(rows, { key: "date", direction: "asc" }).map((r) => r.id)).toEqual(["3", "1", "4", "2"]);
  });

  it("por custo, desempate pela data mais recente", () => {
    expect(sortHistory(rows, { key: "cost", direction: "desc" }).map((r) => r.id)).toEqual(["3", "4", "1", "2"]);
    expect(sortHistory(rows, { key: "cost", direction: "asc" }).map((r) => r.id)).toEqual(["2", "4", "1", "3"]);
  });

  it("não altera o array original", () => {
    const copy = [...rows];
    sortHistory(rows, { key: "cost", direction: "asc" });
    expect(rows).toEqual(copy);
  });

  it("toggleSort inverte a mesma coluna e começa desc em outra", () => {
    expect(toggleSort({ key: "date", direction: "desc" }, "date")).toEqual({ key: "date", direction: "asc" });
    expect(toggleSort({ key: "date", direction: "asc" }, "cost")).toEqual({ key: "cost", direction: "desc" });
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);

  it("fatia 20 por página", () => {
    expect(paginate(items, 1, 20)).toMatchObject({ page: 1, pageCount: 3, total: 45, start: 1, end: 20 });
    expect(paginate(items, 3, 20)).toMatchObject({ rows: [41, 42, 43, 44, 45], start: 41, end: 45 });
  });

  it("limita a página ao intervalo válido", () => {
    expect(paginate(items, 9, 20).page).toBe(3);
    expect(paginate(items, 0, 20).page).toBe(1);
    expect(paginate([], 2, 20)).toMatchObject({ page: 1, pageCount: 1, start: 0, end: 0 });
  });

  it("janela de páginas com reticências", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
});

describe("razões por linha", () => {
  it("CTR e CPL real (custo ÷ leads contados pelo banco)", () => {
    const row = { impressions: 1000, clicks: 50, cost: 150, leads_total: 3, leads_agendados: 1 };
    expect(rowCtr(row)).toBe(5);
    expect(rowCpl(row)).toBe(50);
    expect(rowCpl({ ...row, leads_total: 0 })).toBeNull();
    expect(rowCtr({ ...row, impressions: 0 })).toBeNull();
  });
});
