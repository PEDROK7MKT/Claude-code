import { describe, expect, it } from "vitest";
import { parseBody, readBodyText } from "@/features/webhook/lib/body";

const URL_ = "https://crm.test/api/webhook/lead";

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

/** Request com corpo em stream (sem Content-Length), como um envio "chunked". */
function streamRequest(...chunks: string[]): Request {
  const init: RequestInit & { duplex: "half" } = { method: "POST", body: streamOf(...chunks), duplex: "half" };
  return new Request(URL_, init);
}

describe("readBodyText", () => {
  it("lê o corpo em UTF-8", async () => {
    const request = new Request(URL_, { method: "POST", body: '{"name":"João"}' });
    expect(await readBodyText(request, 1024)).toEqual({ ok: true, text: '{"name":"João"}' });
  });

  it("recusa pelo Content-Length declarado sem ler o corpo", async () => {
    const request = new Request(URL_, { method: "POST", body: "x", headers: { "content-length": "999999" } });
    expect(await readBodyText(request, 1024)).toEqual({ ok: false, status: 413 });
  });

  it("recusa corpo em stream que passa do limite", async () => {
    expect(await readBodyText(streamRequest("a".repeat(600), "b".repeat(600)), 1024)).toEqual({ ok: false, status: 413 });
  });

  it("junta pedaços do stream (inclusive caractere dividido entre pedaços)", async () => {
    const bytes = new TextEncoder().encode("ção");
    const request = new Request(URL_, {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes.slice(0, 1));
          controller.enqueue(bytes.slice(1));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect(await readBodyText(request, 1024)).toEqual({ ok: true, text: "ção" });
  });

  it("sem corpo → texto vazio", async () => {
    expect(await readBodyText(new Request(URL_, { method: "POST" }), 1024)).toEqual({ ok: true, text: "" });
  });
});

describe("parseBody", () => {
  it("JSON", () => {
    expect(parseBody('{"name":"Maria","phone":"77987654321"}', "application/json; charset=utf-8")).toEqual({
      ok: true,
      data: { name: "Maria", phone: "77987654321" },
    });
  });

  it("formulário urlencoded (primeira ocorrência não vazia vence)", () => {
    const result = parseBody("name=Maria+Silva&phone=%2877%29+98765-4321&phone=outro&notes=", "application/x-www-form-urlencoded");
    expect(result.ok && { ...result.data }).toEqual({ name: "Maria Silva", phone: "(77) 98765-4321", notes: "" });
  });

  it("campo __proto__ no formulário não altera o protótipo", () => {
    const result = parseBody("__proto__=x&name=A", "application/x-www-form-urlencoded");
    expect(result.ok && Object.keys(result.data)).toEqual(["__proto__", "name"]);
  });

  it("text/plain ou sem tipo: detecta JSON ou formulário pelo conteúdo", () => {
    expect(parseBody('{"name":"A"}', "text/plain;charset=UTF-8")).toEqual({ ok: true, data: { name: "A" } });
    const form = parseBody("name=A&phone=1", null);
    expect(form.ok && { ...form.data }).toEqual({ name: "A", phone: "1" });
  });

  it("JSON inválido ou que não é objeto → 400", () => {
    expect(parseBody("{name:", "application/json")).toMatchObject({ ok: false, status: 400 });
    expect(parseBody("[1,2]", "application/json")).toMatchObject({ ok: false, status: 400 });
    expect(parseBody('"texto"', "application/json")).toMatchObject({ ok: false, status: 400 });
  });

  it("corpo vazio → 400", () => {
    expect(parseBody("  ", "application/json")).toMatchObject({ ok: false, status: 400 });
  });

  it("multipart e outros tipos → 415", () => {
    expect(parseBody("x", "multipart/form-data; boundary=abc")).toMatchObject({ ok: false, status: 415 });
    expect(parseBody("<xml/>", "application/xml")).toMatchObject({ ok: false, status: 415 });
  });

  it("aceita application/*+json e ignora BOM", () => {
    expect(parseBody('﻿{"name":"A"}', "application/vnd.api+json")).toEqual({ ok: true, data: { name: "A" } });
  });
});
