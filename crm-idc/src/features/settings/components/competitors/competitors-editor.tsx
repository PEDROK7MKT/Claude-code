"use client";

import * as React from "react";
import { Loader2Icon, PlusIcon, RotateCcwIcon, SaveIcon, TrophyIcon, UndoIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSettings, useUpdateAppSettings } from "@/features/settings/api/app-settings";
import { COMPETITORS } from "@/lib/constants";
import type { AppSettings, Competitor } from "@/types/database";
import {
  MAX_COMPETITORS,
  competitorsToDrafts,
  describeCompetitorSummary,
  draftsDiffer,
  emptyCompetitorDraft,
  formatDraftField,
  moveItem,
  sameCompetitors,
  summarizeCompetitors,
  validateCompetitorDrafts,
  type CompetitorDraft,
  type CompetitorDraftErrors,
  type CompetitorField,
} from "../../lib/competitors";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { CompetitorRow, type RowMove } from "./competitor-row";

export interface CompetitorsEditorProps {
  initialSettings: AppSettings;
  onDirtyChange?: (dirty: boolean) => void;
}

/** Elemento visível (os botões de ação existem em dois layouts: celular e desktop). */
function focusVisible(root: HTMLElement | null, selector: string): boolean {
  const target = Array.from(root?.querySelectorAll<HTMLElement>(selector) ?? []).find(
    (el) => el.offsetParent !== null && !(el as HTMLButtonElement).disabled,
  );
  target?.focus();
  return Boolean(target);
}

/**
 * Aba "Concorrentes": tabela editável dos concorrentes do comparativo do GMN
 * (spec §4.6/§4.8). Edição local; grava tudo de uma vez com useUpdateAppSettings.
 */
export function CompetitorsEditor({ initialSettings, onDirtyChange }: CompetitorsEditorProps) {
  const { data: settings = initialSettings } = useAppSettings(initialSettings);
  const update = useUpdateAppSettings();
  const saved = settings.competitors;

  // ids locais estáveis: "<geração>:<índice>" ao carregar/restaurar, "n<contador>" ao adicionar
  const [generation, setGeneration] = React.useState(0);
  const [drafts, setDrafts] = React.useState<CompetitorDraft[]>(() => competitorsToDrafts(saved, (i) => `0:${i}`));
  const [addedCount, setAddedCount] = React.useState(0);
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(() => new Set());
  const [submitted, setSubmitted] = React.useState(false);
  const [confirm, setConfirm] = React.useState<"restore" | "discard" | null>(null);
  const listRef = React.useRef<HTMLOListElement>(null);

  const validation = React.useMemo(() => validateCompetitorDrafts(drafts), [drafts]);
  const dirty = draftsDiffer(drafts, saved);
  const isDefault = sameCompetitors(validation.competitors ?? [], COMPETITORS) && drafts.length === COMPETITORS.length;
  const summary = summarizeCompetitors(saved);
  const saving = update.isPending;

  useUnsavedChanges(dirty, onDirtyChange);

  const visibleErrors = (draft: CompetitorDraft): CompetitorDraftErrors => {
    const all = validation.errors[draft.id];
    if (!all) return {};
    if (submitted) return all;
    const out: CompetitorDraftErrors = {};
    for (const field of ["name", "rating", "reviews"] as const) {
      if (all[field] && touched.has(`${draft.id}:${field}`)) out[field] = all[field];
    }
    return out;
  };

  const resetTo = (list: readonly Competitor[]) => {
    const next = generation + 1;
    setGeneration(next);
    setDrafts(competitorsToDrafts(list, (i) => `${next}:${i}`));
    setTouched(new Set());
    setSubmitted(false);
  };

  const change = (id: string, field: CompetitorField, value: string) => {
    setDrafts((list) => list.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const blur = (id: string, field: CompetitorField) => {
    setTouched((prev) => new Set(prev).add(`${id}:${field}`));
    if (field === "name") return;
    setDrafts((list) => list.map((d) => (d.id === id ? { ...d, [field]: formatDraftField(field, d[field]) } : d)));
  };

  const move = (id: string, direction: RowMove) => {
    const from = drafts.findIndex((d) => d.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= drafts.length) return;
    setDrafts(moveItem(drafts, from, to));
    // mover o nó no DOM tira o foco: devolve ao mesmo botão (ou ao oposto, se chegou na ponta)
    requestAnimationFrame(() => {
      const root = listRef.current;
      if (!focusVisible(root, `[data-row="${id}"] [data-action="${direction}"]`)) {
        focusVisible(root, `[data-row="${id}"] [data-action="${direction === "up" ? "down" : "up"}"]`);
      }
    });
  };

  const add = () => {
    const id = `n${addedCount + 1}`;
    setAddedCount((n) => n + 1);
    setDrafts((list) => [...list, emptyCompetitorDraft(id)]);
    requestAnimationFrame(() => focusVisible(listRef.current, `[data-row="${id}"] [data-field="name"]`));
  };

  const remove = (id: string) => {
    const index = drafts.findIndex((d) => d.id === id);
    if (index < 0) return;
    const removed = drafts[index];
    setDrafts(drafts.filter((d) => d.id !== id));
    toast(`${removed.name.trim() || "Concorrente"} removido da lista`, {
      description: "A alteração só vale depois de salvar.",
      action: {
        label: "Desfazer",
        onClick: () =>
          setDrafts((list) => (list.some((d) => d.id === id) ? list : [...list.slice(0, index), removed, ...list.slice(index)])),
      },
    });
    requestAnimationFrame(() => {
      const next = drafts[index + 1] ?? drafts[index - 1];
      if (next) focusVisible(listRef.current, `[data-row="${next.id}"] [data-field="name"]`);
    });
  };

  const save = async () => {
    setSubmitted(true);
    if (!validation.competitors) {
      toast.error(validation.formError ?? "Corrija os campos destacados antes de salvar.");
      const firstInvalid = drafts.find((d) => validation.errors[d.id]);
      if (firstInvalid) {
        const field = (["name", "rating", "reviews"] as const).find((f) => validation.errors[firstInvalid.id]?.[f]);
        requestAnimationFrame(() =>
          focusVisible(listRef.current, `[data-row="${firstInvalid.id}"] [data-field="${field ?? "name"}"]`),
        );
      }
      return;
    }
    try {
      const result = await update.mutateAsync({ competitors: validation.competitors });
      resetTo(result.competitors);
    } catch {
      // toast de erro já exibido pelo hook; mantém a edição
    }
  };

  return (
    <Card className="gap-5 pb-0" role="region" aria-labelledby="competitors-title">
      <CardHeader>
        <CardTitle id="competitors-title" className="text-base">
          Concorrentes no Google
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">
            Clínicas de Barreiras usadas no comparativo da página Google Meu Negócio. O IDC entra automaticamente com a
            nota e as avaliações mais recentes.
          </span>
          <span className="text-foreground/80 block text-xs font-medium tabular-nums">
            Salvo: {describeCompetitorSummary(summary)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {drafts.length === 0 ? (
          <EmptyState
            size="sm"
            icon={TrophyIcon}
            title="Nenhum concorrente na lista"
            description="Sem concorrentes, o comparativo do GMN mostra só o IDC."
            action={{ label: "Adicionar concorrente", icon: PlusIcon, onClick: add }}
            secondaryAction={{ label: "Restaurar padrão", icon: RotateCcwIcon, onClick: () => resetTo(COMPETITORS) }}
          />
        ) : (
          <div className="md:rounded-lg md:border">
            <div
              aria-hidden="true"
              className="text-muted-foreground bg-muted/40 hidden gap-3 border-b px-2 py-2 text-xs font-medium md:grid md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_8rem_7.5rem]"
            >
              <span className="text-center">#</span>
              <span>Nome</span>
              <span className="text-right">Nota (0–5)</span>
              <span className="text-right">Avaliações</span>
              <span className="text-right">Ordem</span>
            </div>
            <ol ref={listRef} className="space-y-3 md:space-y-0" aria-label="Concorrentes, na ordem de exibição">
              {drafts.map((draft, index) => (
                <CompetitorRow
                  key={draft.id}
                  draft={draft}
                  index={index}
                  total={drafts.length}
                  errors={visibleErrors(draft)}
                  disabled={saving}
                  onChange={change}
                  onBlur={blur}
                  onMove={move}
                  onRemove={remove}
                />
              ))}
            </ol>
          </div>
        )}

        {validation.formError && submitted ? (
          <p role="alert" className="text-destructive text-sm">
            {validation.formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={add} disabled={saving || drafts.length >= MAX_COMPETITORS}>
            <PlusIcon aria-hidden="true" />
            Adicionar concorrente
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirm("restore")}
            disabled={saving || isDefault}
          >
            <RotateCcwIcon aria-hidden="true" />
            Restaurar padrão
          </Button>
        </div>
      </CardContent>

      <CardFooter className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky bottom-0 z-10 flex-col-reverse gap-2 rounded-b-xl border-t pt-4 pb-4 backdrop-blur sm:flex-row sm:justify-between [.border-t]:pt-4">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {dirty ? "Você tem alterações não salvas." : "Tudo salvo."}
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setConfirm("discard")}
            disabled={!dirty || saving}
          >
            <UndoIcon aria-hidden="true" />
            Descartar
          </Button>
          <Button type="button" className="flex-1 sm:flex-none" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <SaveIcon aria-hidden="true" />}
            {saving ? "Salvando..." : "Salvar concorrentes"}
          </Button>
        </div>
      </CardFooter>

      <ConfirmDialog
        open={confirm === "restore"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="Restaurar a lista padrão?"
        description={`A lista volta aos ${COMPETITORS.length} concorrentes iniciais (${COMPETITORS.map((c) => c.name).join(", ")}). Nada é gravado até você clicar em "Salvar concorrentes".`}
        confirmLabel="Restaurar padrão"
        onConfirm={() => resetTo(COMPETITORS)}
      />
      <ConfirmDialog
        open={confirm === "discard"}
        onOpenChange={(next) => !next && setConfirm(null)}
        destructive
        title="Descartar alterações?"
        description="As edições feitas desde o último salvamento serão perdidas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={() => resetTo(saved)}
      />
    </Card>
  );
}
