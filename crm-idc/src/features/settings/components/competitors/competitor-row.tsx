"use client";

import type { ReactNode } from "react";
import { StarIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMPETITOR_NAME_MAX,
  type CompetitorDraft,
  type CompetitorDraftErrors,
  type CompetitorField,
} from "../../lib/competitors";

export interface CompetitorRowProps {
  draft: CompetitorDraft;
  index: number;
  /** Erros visíveis (campos já tocados ou após tentar salvar) */
  errors: CompetitorDraftErrors;
  disabled: boolean;
  onChange: (id: string, field: CompetitorField, value: string) => void;
  onBlur: (id: string, field: CompetitorField) => void;
  onRemove: (id: string) => void;
}

/**
 * Uma linha do editor: card no celular, linha de "tabela" (grid) a partir de `md`.
 * Os rótulos ficam visíveis só no celular — no desktop o cabeçalho faz esse papel.
 * Sem controles de ordem: o comparativo do GMN ordena sozinho (avaliações, nota, nome).
 */
export function CompetitorRow({ draft, index, errors, disabled, onChange, onBlur, onRemove }: CompetitorRowProps) {
  const base = `competitor-${draft.id}`;
  const label = draft.name.trim() || `concorrente ${index + 1}`;

  const actions = <RemoveButton id={draft.id} label={label} disabled={disabled} onRemove={onRemove} />;

  return (
    <li
      data-row={draft.id}
      className="bg-card rounded-lg border p-3 md:grid md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_8rem_2rem] md:items-start md:gap-3 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-2 md:py-2.5 md:last:border-b-0"
    >
      <div className="mb-2 flex items-center justify-between md:mb-0 md:h-9">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
          {index + 1}
        </span>
        <div className="md:hidden">{actions}</div>
      </div>

      <Field id={`${base}-name`} label="Nome" error={errors.name}>
        <Input
          id={`${base}-name`}
          data-field="name"
          value={draft.name}
          onChange={(e) => onChange(draft.id, "name", e.target.value)}
          onBlur={() => onBlur(draft.id, "name")}
          maxLength={COMPETITOR_NAME_MAX + 10}
          placeholder="Nome da clínica"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${base}-name-error` : undefined}
        />
      </Field>

      <div className="mt-3 grid grid-cols-2 gap-3 md:contents">
        <Field id={`${base}-rating`} label="Nota (0–5)" error={errors.rating}>
          <div className="relative">
            <Input
              id={`${base}-rating`}
              data-field="rating"
              value={draft.rating}
              onChange={(e) => onChange(draft.id, "rating", e.target.value)}
              onBlur={() => onBlur(draft.id, "rating")}
              inputMode="decimal"
              placeholder="4,9"
              maxLength={4}
              autoComplete="off"
              disabled={disabled}
              aria-invalid={Boolean(errors.rating)}
              aria-describedby={errors.rating ? `${base}-rating-error` : undefined}
              className="pr-8 text-right tabular-nums"
            />
            <StarIcon
              aria-hidden="true"
              className="fill-gold text-gold pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2"
            />
          </div>
        </Field>
        <Field id={`${base}-reviews`} label="Nº de avaliações" error={errors.reviews}>
          <Input
            id={`${base}-reviews`}
            data-field="reviews"
            value={draft.reviews}
            onChange={(e) => onChange(draft.id, "reviews", e.target.value)}
            onBlur={() => onBlur(draft.id, "reviews")}
            inputMode="numeric"
            placeholder="0"
            maxLength={9}
            autoComplete="off"
            disabled={disabled}
            aria-invalid={Boolean(errors.reviews)}
            aria-describedby={errors.reviews ? `${base}-reviews-error` : undefined}
            className="text-right tabular-nums"
          />
        </Field>
      </div>

      <div className="hidden md:flex md:h-9 md:items-center md:justify-end">{actions}</div>
    </li>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs md:sr-only">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface RemoveButtonProps {
  id: string;
  label: string;
  disabled: boolean;
  onRemove: (id: string) => void;
}

function RemoveButton({ id, label, disabled, onRemove }: RemoveButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Remover ${label}`}
      title="Remover"
      disabled={disabled}
      onClick={() => onRemove(id)}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2Icon aria-hidden="true" />
    </Button>
  );
}
