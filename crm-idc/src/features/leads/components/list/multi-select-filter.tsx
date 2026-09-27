"use client";

import * as React from "react";
import { ChevronDownIcon, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleListValue } from "@/features/leads/lib/list-filters";
import { cn } from "@/lib/utils";

export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
}

export interface MultiSelectFilterProps<T extends string> {
  /** Rótulo do botão ("Status", "Fonte"…) */
  label: string;
  icon: LucideIcon;
  /** Opções na ordem canônica */
  options: ReadonlyArray<MultiSelectOption<T>>;
  selected: readonly T[];
  onChange: (next: T[]) => void;
  /** Conteúdo de cada opção (ex.: StatusBadge); padrão: o rótulo */
  renderOption?: (option: MultiSelectOption<T>) => React.ReactNode;
  className?: string;
}

/**
 * Filtro de múltipla escolha em menu (desktop): itens com caixa de seleção
 * (`menuitemcheckbox`), o menu continua aberto a cada clique e o botão mostra
 * quantos valores estão ativos.
 */
export function MultiSelectFilter<T extends string>({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  renderOption,
  className,
}: MultiSelectFilterProps<T>) {
  const order = React.useMemo(() => options.map((option) => option.value), [options]);
  const count = selected.length;
  const single = count === 1 ? options.find((option) => option.value === selected[0]) : undefined;
  const summary = count === 0 ? "todos" : single ? single.label : `${count} selecionados`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-active={count > 0}
          aria-label={`${label}: ${summary}`}
          className={cn(
            "data-[active=true]:border-primary/40 data-[active=true]:bg-primary/5 data-[active=true]:text-primary justify-between gap-2",
            className,
          )}
        >
          <Icon aria-hidden="true" className="opacity-70" />
          <span>{label}</span>
          {count > 0 ? (
            <span className="bg-primary text-primary-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-5 font-semibold tabular-nums">
              {count}
            </span>
          ) : null}
          <ChevronDownIcon aria-hidden="true" className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Filtrar por {label.toLowerCase()}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            // mantém o menu aberto para marcar vários
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => onChange(toggleListValue(selected, option.value, order))}
          >
            {renderOption ? renderOption(option) : option.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={count === 0} onSelect={() => onChange([])} className="text-muted-foreground">
          Limpar seleção
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
