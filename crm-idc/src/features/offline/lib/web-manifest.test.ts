import { describe, expect, it } from "vitest";

import AppleIcon, { generateImageMetadata } from "@/app/apple-icon";
import manifest from "@/app/manifest";
import { classifyRequest } from "./cache-strategy";
import { APP_NAME, APP_SHORT_NAME, buildWebManifest } from "./web-manifest";

const ORIGIN = "https://crm.idc.test";

/** Largura/altura do cabeçalho IHDR de um PNG. */
function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("manifest", () => {
  const m = buildWebManifest();

  it("identidade e aparência pedidas na spec", () => {
    expect(m.name).toBe(APP_NAME);
    expect(m.name).toBe("IDC CRM — Instituto Décio Carrilho");
    expect(m.short_name).toBe(APP_SHORT_NAME);
    expect(m.start_url).toBe("/dashboard");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#0D6E6E");
    expect(m.background_color).toBe("#F5F5F5");
    expect(m.lang).toBe("pt-BR");
  });

  it("rota /manifest.webmanifest devolve o mesmo objeto", () => {
    expect(manifest()).toEqual(m);
  });

  it("ícones instaláveis: SVG any + PNG 192/512 any e maskable", () => {
    const icons = m.icons ?? [];
    expect(icons).toContainEqual({ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" });
    for (const purpose of ["any", "maskable"] as const) {
      for (const size of [192, 512]) {
        expect(icons).toContainEqual({
          src: `/apple-icon/${size}.png`,
          sizes: `${size}x${size}`,
          type: "image/png",
          purpose,
        });
      }
    }
  });

  it("start_url e atalhos dentro do escopo e tratados como páginas pelo SW", () => {
    const urls = [m.start_url ?? "", ...(m.shortcuts ?? []).map((s) => s.url)];
    for (const url of urls) {
      expect(url.startsWith(m.scope ?? "/")).toBe(true);
      expect(classifyRequest({ url: `${ORIGIN}${url}`, method: "GET", mode: "navigate" }, ORIGIN)).toBe(
        "network-first-page",
      );
    }
  });

  it("ícones do manifest são cache-first no SW", () => {
    for (const icon of m.icons ?? []) {
      expect(classifyRequest({ url: `${ORIGIN}${icon.src}`, method: "GET", destination: "image" }, ORIGIN)).toBe(
        "cache-first",
      );
    }
  });
});

describe("apple-icon", () => {
  it("gera 180, 192 e 512 em PNG", () => {
    expect(generateImageMetadata()).toEqual([
      { id: "180.png", size: { width: 180, height: 180 }, contentType: "image/png" },
      { id: "192.png", size: { width: 192, height: 192 }, contentType: "image/png" },
      { id: "512.png", size: { width: 512, height: 512 }, contentType: "image/png" },
    ]);
  });

  it.each([
    ["192.png", 192],
    ["512.png", 512],
  ])("renderiza %s com o tamanho certo", async (id, size) => {
    const response = await AppleIcon({ id: Promise.resolve(id) });
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(1, 4)].map((b) => String.fromCharCode(b)).join("")).toBe("PNG");
    expect(pngSize(bytes)).toEqual({ width: size, height: size });
  });
});
