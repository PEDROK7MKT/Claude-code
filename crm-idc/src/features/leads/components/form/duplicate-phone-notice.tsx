"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLinkIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { leadDetailHref } from "@/features/leads/lib/list-display";
import { summarizeDuplicates } from "@/features/leads/lib/lead-duplicates";
import { formatDate } from "@/lib/dates";
import type { Lead } from "@/types/database";

const MAX_LISTED = 3;

export interface DuplicatePhoneNoticeProps {
  duplicates: readonly Lead[];
  checking: boolean;
  /** create: aviso de cadastro duplicado · edit: o telefone novo pertence a outro lead */
  mode: "create" | "edit";
  id?: string;
}

/** Regra 4 — aviso logo abaixo do telefone quando ele já está cadastrado. */
export function DuplicatePhoneNotice({ duplicates, checking, mode, id }: DuplicatePhoneNoticeProps) {
  if (checking) {
    return (
      <p id={id} role="status" className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
        Verificando se o telefone já está cadastrado…
      </p>
    );
  }
  if (duplicates.length === 0) return null;

  const summary = summarizeDuplicates(duplicates);
  const listed = duplicates.slice(0, MAX_LISTED);

  return (
    <Alert id={id} role="status" className="border-amber-300 bg-amber-50 text-amber-900">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>
        {mode === "edit" ? "Este telefone já pertence a outro lead" : summary.title}
      </AlertTitle>
      <AlertDescription className="text-amber-900/80">
        <p>
          {summary.description}{" "}
          {mode === "create" ? "Ao salvar, você poderá vincular este cadastro ao lead existente." : null}
        </p>
        <ul className="mt-1 grid w-full gap-1.5">
          {listed.map((lead) => (
            <li key={lead.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={leadDetailHref(lead.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground focus-visible:ring-ring/50 inline-flex min-w-0 items-center gap-1 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
              >
                <span className="truncate">{lead.name.trim() || "Sem nome"}</span>
                <ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="sr-only">(abre em nova aba)</span>
              </Link>
              <StatusBadge status={lead.status} />
              <span className="text-xs tabular-nums">desde {formatDate(lead.created_at)}</span>
            </li>
          ))}
        </ul>
        {duplicates.length > MAX_LISTED ? (
          <p className="text-xs">e mais {duplicates.length - MAX_LISTED} lead(s) com este telefone.</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
