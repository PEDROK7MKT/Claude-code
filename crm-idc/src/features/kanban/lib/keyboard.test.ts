import { describe, expect, it } from "vitest";

import { centeredLeft, pickAdjacentColumn, type ColumnRect } from "./keyboard";

const columns: ColumnRect[] = [
  { id: "novo", left: 0, width: 280 },
  { id: "em_contato", left: 292, width: 280 },
  { id: "perdido", left: 2200, width: 280 },
];

describe("pickAdjacentColumn", () => {
  it("vai para a coluna vizinha mais próxima na direção", () => {
    const card = { left: 8, width: 264 }; // dentro de "novo"
    expect(pickAdjacentColumn(card, columns, "right")?.id).toBe("em_contato");
    expect(pickAdjacentColumn({ left: 300, width: 264 }, columns, "right")?.id).toBe("perdido");
    expect(pickAdjacentColumn({ left: 300, width: 264 }, columns, "left")?.id).toBe("novo");
  });

  it("não sai do lugar nas pontas e ignora a própria coluna", () => {
    expect(pickAdjacentColumn({ left: 8, width: 264 }, columns, "left")).toBeNull();
    expect(pickAdjacentColumn({ left: 2208, width: 264 }, columns, "right")).toBeNull();
    expect(pickAdjacentColumn({ left: 0, width: 280 }, [columns[0]], "right")).toBeNull();
  });
});

describe("centeredLeft", () => {
  it("centraliza o card sobre a coluna", () => {
    expect(centeredLeft({ left: 292, width: 280 }, 264)).toBe(300);
  });
});
