"use client";

import * as React from "react";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { normalizeSearchTerm, SEARCH_MAX_LENGTH } from "@/features/leads/lib/list-params";
import { cn } from "@/lib/utils";

export interface LeadSearchInputProps {
  /** Termo aplicado (da URL) */
  value: string;
  /** Aplica um novo termo (já normalizado) */
  onSearch: (term: string) => void;
  /** Mostra o indicador de busca em andamento */
  busy?: boolean;
  className?: string;
}

/**
 * Busca por nome ou telefone (aceita "(77) 98765-4321", "+55 77…" ou só dígitos).
 * Aplica 300ms depois da última tecla; Enter aplica na hora e Esc limpa.
 */
export function LeadSearchInput({ value, onSearch, busy = false, className }: LeadSearchInputProps) {
  const inputId = React.useId();
  const [text, setText] = React.useState(value);
  const [appliedValue, setAppliedValue] = React.useState(value);
  const debounced = useDebouncedValue(text, 300);

  // Mudança vinda de fora (chip removido, "Limpar filtros", link): reflete no campo —
  // exceto o eco do próprio termo digitado, para não apagar o que ainda está sendo escrito.
  if (value !== appliedValue) {
    setAppliedValue(value);
    if (value !== normalizeSearchTerm(debounced)) setText(value);
  }

  const applyDebounced = React.useEffectEvent((term: string) => {
    const normalized = normalizeSearchTerm(term);
    if (normalized !== value) onSearch(normalized);
  });

  React.useEffect(() => {
    applyDebounced(debounced);
  }, [debounced]);

  const applyNow = (term: string) => {
    const normalized = normalizeSearchTerm(term);
    if (normalized !== value) onSearch(normalized);
  };

  const clear = () => {
    setText("");
    applyNow("");
  };

  return (
    <div role="search" className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar leads por nome ou telefone
      </label>
      {busy ? (
        <Loader2Icon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin"
        />
      ) : (
        <SearchIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
      )}
      <Input
        id={inputId}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder="Buscar por nome ou telefone"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyNow(text);
          } else if (event.key === "Escape" && text) {
            event.preventDefault();
            clear();
          }
        }}
        className="h-10 pr-10 pl-9 md:h-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {text ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar busca"
          className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]"
        >
          <XIcon aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
