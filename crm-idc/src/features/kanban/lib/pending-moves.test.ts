import { describe, expect, it } from "vitest";

import {
  SAVED_MOVE_TTL_MS,
  addAwaitingMove,
  addSavedMove,
  applyLeadOverlays,
  buildLeadOverlays,
  isSavedMoveConfirmed,
  liveSavedMoves,
  mergeLeadLists,
  parseSavingChange,
  removeAwaitingMove,
  visiblePendingKind,
  type AwaitingMove,
  type SavedMove,
} from "./pending-moves";
import { makeLead } from "./test-fixtures";

const NOW = Date.parse("2026-03-12T12:00:00Z");

describe("parseSavingChange", () => {
  it("lê as variáveis de useChangeLeadStatus", () => {
    const lead = makeLead();
    expect(parseSavingChange({ lead, to: "agendado", scheduledAt: "2026-03-20T13:00:00Z" }, NOW)).toEqual({
      lead,
      to: "agendado",
      scheduledAt: "2026-03-20T13:00:00Z",
      submittedAt: NOW,
    });
    expect(parseSavingChange({ lead, to: "em_contato" }, NOW)?.scheduledAt).toBeNull();
  });

  it("ignora formatos desconhecidos", () => {
    expect(parseSavingChange(undefined, NOW)).toBeNull();
    expect(parseSavingChange({ lead: { id: 1 }, to: "novo" }, NOW)).toBeNull();
    expect(parseSavingChange({ lead: makeLead(), to: "xyz" }, NOW)).toBeNull();
  });
});

describe("mergeLeadLists", () => {
  it("remove duplicados preferindo o updated_at mais recente", () => {
    const stale = makeLead({ id: "a", status: "novo", updated_at: "2026-03-10T10:00:00Z" });
    const fresh = makeLead({ id: "a", status: "em_contato", updated_at: "2026-03-10T11:00:00+00:00" });
    const other = makeLead({ id: "b" });
    const merged = mergeLeadLists([stale, other], undefined, [fresh]);
    expect(merged.map((l) => [l.id, l.status])).toEqual([
      ["a", "em_contato"],
      ["b", "novo"],
    ]);
    expect(mergeLeadLists([fresh], [stale])[0].status).toBe("em_contato");
  });
});

describe("movimentos salvos", () => {
  const saved = makeLead({ id: "a", status: "em_contato", updated_at: "2026-03-12T11:59:00Z" });

  it("são confirmados quando os dados alcançam o updated_at salvo", () => {
    expect(isSavedMoveConfirmed(saved, undefined)).toBe(false);
    expect(isSavedMoveConfirmed(saved, makeLead({ updated_at: "2026-03-12T11:00:00Z" }))).toBe(false);
    expect(isSavedMoveConfirmed(saved, makeLead({ updated_at: "2026-03-12T11:59:00.000Z" }))).toBe(true);
    expect(isSavedMoveConfirmed(saved, makeLead({ updated_at: "2026-03-12T12:30:00Z" }))).toBe(true);
  });

  it("deixam de valer depois do TTL", () => {
    const moves: SavedMove[] = [{ lead: saved, savedAt: NOW - SAVED_MOVE_TTL_MS - 1 }];
    expect(liveSavedMoves(moves, new Map(), NOW)).toEqual([]);
    expect(liveSavedMoves([{ lead: saved, savedAt: NOW }], new Map(), NOW)).toHaveLength(1);
  });

  it("addSavedMove substitui o do mesmo lead e descarta vencidos", () => {
    const old: SavedMove = { lead: makeLead({ id: "old" }), savedAt: NOW - SAVED_MOVE_TTL_MS - 5 };
    const previous: SavedMove = { lead: makeLead({ id: "a", status: "novo" }), savedAt: NOW - 1000 };
    const next = addSavedMove([old, previous], saved, NOW);
    expect(next).toEqual([{ lead: saved, savedAt: NOW }]);
  });
});

describe("movimentos aguardando diálogo", () => {
  it("um por lead e remoção sem trocar a referência quando não há nada", () => {
    const first: AwaitingMove = { lead: makeLead({ id: "a" }), to: "perdido", startedAt: NOW };
    const second: AwaitingMove = { lead: makeLead({ id: "a" }), to: "em_contato", startedAt: NOW };
    const list = addAwaitingMove(addAwaitingMove([], first), second);
    expect(list).toEqual([second]);
    expect(removeAwaitingMove(list, "zzz")).toBe(list);
    expect(removeAwaitingMove(list, "a")).toEqual([]);
  });
});

describe("buildLeadOverlays / applyLeadOverlays", () => {
  const novo = makeLead({ id: "a", status: "em_contato", updated_at: "2026-03-10T10:00:00Z" });
  const other = makeLead({ id: "b", status: "novo" });

  it("card solto aparece no destino, com updated_at do momento do arraste", () => {
    const overlays = buildLeadOverlays(
      { awaiting: [{ lead: novo, to: "perdido", startedAt: NOW }], saving: [], saved: [] },
      [novo, other],
      NOW,
    );
    const overlay = overlays.get("a");
    expect(overlay?.kind).toBe("awaiting");
    expect(overlay?.lead.status).toBe("perdido");
    expect(overlay?.lead.updated_at).toBe("2026-03-12T12:00:00.000Z");
    expect(applyLeadOverlays([novo, other], overlays).map((l) => [l.id, l.status])).toEqual([
      ["a", "perdido"],
      ["b", "novo"],
    ]);
  });

  it("salvando usa a data do agendamento e vence o aguardando", () => {
    const overlays = buildLeadOverlays(
      {
        awaiting: [{ lead: novo, to: "agendado", startedAt: NOW }],
        saving: [{ lead: novo, to: "agendado", scheduledAt: "2026-03-20T13:00:00.000Z", submittedAt: NOW }],
        saved: [],
      },
      [novo],
      NOW,
    );
    expect(overlays.get("a")?.kind).toBe("saving");
    expect(overlays.get("a")?.lead.scheduled_at).toBe("2026-03-20T13:00:00.000Z");
  });

  it("inclui o lead que a atualização otimista tirou da consulta", () => {
    const serverLead = makeLead({ id: "a", status: "perdido", updated_at: "2026-03-12T11:59:59Z" });
    const overlays = buildLeadOverlays({ awaiting: [], saving: [], saved: [{ lead: serverLead, savedAt: NOW }] }, [other], NOW);
    expect(applyLeadOverlays([other], overlays).map((l) => [l.id, l.status])).toEqual([
      ["b", "novo"],
      ["a", "perdido"],
    ]);
  });

  it("salvo e já confirmado pelos dados não sobrepõe nada", () => {
    const serverLead = makeLead({ id: "a", status: "perdido", updated_at: "2026-03-12T11:59:59Z" });
    const refetched = { ...serverLead };
    const overlays = buildLeadOverlays({ awaiting: [], saving: [], saved: [{ lead: serverLead, savedAt: NOW }] }, [refetched], NOW);
    expect(overlays.size).toBe(0);
    expect(applyLeadOverlays([refetched], overlays)).toEqual([refetched]);
  });

  it("indicador visível só para aguardando e salvando", () => {
    expect(visiblePendingKind(undefined)).toBeNull();
    expect(visiblePendingKind({ lead: novo, kind: "saved" })).toBeNull();
    expect(visiblePendingKind({ lead: novo, kind: "saving" })).toBe("saving");
    expect(visiblePendingKind({ lead: novo, kind: "awaiting" })).toBe("awaiting");
  });
});
