import { describe, expect, it } from "vitest";

import { isLeadId } from "./lead-id";

describe("isLeadId", () => {
  it("aceita UUIDs (maiúsculas ou minúsculas)", () => {
    expect(isLeadId("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isLeadId("A3BB189E-8BF9-3888-9912-ACE4E6543002")).toBe(true);
  });

  it("rejeita outros formatos", () => {
    expect(isLeadId("novo")).toBe(false);
    expect(isLeadId("123")).toBe(false);
    expect(isLeadId("11111111-1111-4111-8111-11111111111")).toBe(false);
    expect(isLeadId(" 11111111-1111-4111-8111-111111111111")).toBe(false);
    expect(isLeadId("")).toBe(false);
    expect(isLeadId(null)).toBe(false);
  });
});
