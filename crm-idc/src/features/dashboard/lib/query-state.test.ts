import { describe, expect, it } from "vitest";
import { queryLoadState } from "./query-state";

describe("queryLoadState", () => {
  it("primeira carga buscando → loading", () => {
    expect(queryLoadState({ data: undefined, isError: false, fetchStatus: "fetching" })).toBe("loading");
  });

  it("sem dados e pausada (offline, nada no cache) → offline, não loading", () => {
    expect(queryLoadState({ data: undefined, isError: false, fetchStatus: "paused" })).toBe("offline");
  });

  it("falhou sem cópia salva → error", () => {
    expect(queryLoadState({ data: undefined, isError: true, fetchStatus: "idle" })).toBe("error");
  });

  it("com dados → ready, mesmo pausada ou com falha ao atualizar", () => {
    expect(queryLoadState({ data: [], isError: false, fetchStatus: "idle" })).toBe("ready");
    expect(queryLoadState({ data: [], isError: false, fetchStatus: "paused" })).toBe("ready");
    expect(queryLoadState({ data: [{ id: "a" }], isError: true, fetchStatus: "idle" })).toBe("ready");
  });

  it("null conta como dado (ex.: consulta que retorna null)", () => {
    expect(queryLoadState({ data: null, isError: false, fetchStatus: "paused" })).toBe("ready");
  });
});
