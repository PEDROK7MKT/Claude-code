import { describe, expect, it } from "vitest";

import { boardSummary, cardServiceLabel, showsAppointment } from "./card";

describe("cardServiceLabel", () => {
  it("usa o rótulo do serviço e o detalhe quando é 'outro'", () => {
    expect(cardServiceLabel({ service: "implante", service_detail: null })).toBe("Implante Dentário");
    expect(cardServiceLabel({ service: "outro", service_detail: " Bruxismo " })).toBe("Outro — Bruxismo");
    expect(cardServiceLabel({ service: "canal", service_detail: "dente 36" })).toBe("Tratamento de Canal");
  });

  it("sem serviço: detalhe livre ou null", () => {
    expect(cardServiceLabel({ service: null, service_detail: null })).toBeNull();
    expect(cardServiceLabel({ service: null, service_detail: "  " })).toBeNull();
    expect(cardServiceLabel({ service: null, service_detail: "Avaliação" })).toBe("Avaliação");
  });
});

describe("showsAppointment", () => {
  it("só agendado e confirmado destacam a consulta", () => {
    expect(showsAppointment("agendado")).toBe(true);
    expect(showsAppointment("confirmado")).toBe(true);
    expect(showsAppointment("compareceu")).toBe(false);
    expect(showsAppointment("novo")).toBe(false);
  });
});

describe("boardSummary", () => {
  it("total do quadro ou recorte filtrado", () => {
    expect(boardSummary(47, 47, false)).toBe("47 leads no quadro");
    expect(boardSummary(1, 1, false)).toBe("1 lead no quadro");
    expect(boardSummary(3, 1234, true)).toBe("3 de 1.234 leads com os filtros atuais");
  });
});
