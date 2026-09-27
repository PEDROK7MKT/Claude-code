import { describe, expect, it } from "vitest";
import type { Profile } from "@/types/database";
import {
  accessMessage,
  describeProfilesSummary,
  needsFirstDentist,
  sortProfiles,
  summarizeProfiles,
  userActionAvailability,
} from "./users";

function profile(overrides: Partial<Profile> & Pick<Profile, "id" | "full_name">): Profile {
  return {
    email: `${overrides.id}@idc.com.br`,
    role: "dentist",
    active: true,
    avatar_url: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

const admin = profile({ id: "a", full_name: "Gestor Tráfego", role: "admin" });
const decio = profile({ id: "d", full_name: "Décio Carrilho" });
const ana = profile({ id: "n", full_name: "ana Souza" });
const old = profile({ id: "o", full_name: "Antigo Admin", role: "admin", active: false });

describe("sortProfiles", () => {
  it("ativos, gestores e depois nome sem diferenciar acentos/caixa", () => {
    expect(sortProfiles([old, decio, ana, admin]).map((p) => p.id)).toEqual(["a", "n", "d", "o"]);
  });

  it("não altera a lista original", () => {
    const list = [decio, admin];
    sortProfiles(list);
    expect(list.map((p) => p.id)).toEqual(["d", "a"]);
  });
});

describe("summarizeProfiles", () => {
  it("conta ativos por perfil", () => {
    const summary = summarizeProfiles([admin, decio, ana, old]);
    expect(summary).toEqual({ total: 4, active: 3, inactive: 1, admins: 1, dentists: 2 });
    expect(describeProfilesSummary(summary)).toBe("4 usuários · 3 ativos · 1 desativado");
    expect(describeProfilesSummary(summarizeProfiles([admin]))).toBe("1 usuário · 1 ativo");
  });

  it("primeiro acesso: sem dentista ativo", () => {
    expect(needsFirstDentist([admin])).toBe(true);
    expect(needsFirstDentist([admin, { ...decio, active: false }])).toBe(true);
    expect(needsFirstDentist([admin, decio])).toBe(false);
  });
});

describe("userActionAvailability", () => {
  it("o próprio usuário não troca o perfil nem se desativa", () => {
    const self = userActionAvailability(admin, "a");
    expect(self["change-role"].allowed).toBe(false);
    expect(self.deactivate).toEqual({ allowed: false, reason: "Você não pode desativar a própria conta." });
    expect(self["edit-name"].allowed).toBe(true);
    expect(self["reset-password"].allowed).toBe(true);
  });

  it("ativar/desativar conforme o status", () => {
    const active = userActionAvailability(decio, "a");
    expect(active.deactivate.allowed).toBe(true);
    expect(active.reactivate.allowed).toBe(false);
    const inactive = userActionAvailability(old, "a");
    expect(inactive.deactivate.allowed).toBe(false);
    expect(inactive.reactivate.allowed).toBe(true);
    expect(inactive["change-role"].allowed).toBe(true);
  });
});

describe("accessMessage", () => {
  it("monta a mensagem com os dados de acesso", () => {
    const text = accessMessage({
      fullName: "Décio Carrilho",
      email: "decio@idc.com.br",
      password: "Xk7#pQ2mZr9a",
      loginUrl: "https://crm.institutodeciocarrilho.com.br/login",
      crmName: "IDC CRM",
    });
    expect(text.split("\n")).toEqual([
      "Olá, Décio! Seu acesso ao IDC CRM foi criado.",
      "",
      "Endereço: https://crm.institutodeciocarrilho.com.br/login",
      "E-mail: decio@idc.com.br",
      "Senha: Xk7#pQ2mZr9a",
      "",
      "Guarde a senha em local seguro e não a compartilhe.",
    ]);
  });
});
