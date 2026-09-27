"use client";

import type { CSSProperties } from "react";
import { BellIcon, CalendarCheckIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BrandMark } from "@/features/shell/components/brand-logo";
import { brandThemeVars } from "../../lib/branding";
import { LogoPreview } from "./logo-preview";

export interface BrandPreviewProps {
  primary: string;
  accent: string;
  crmName: string;
  clinicName: string;
  /** Logo validado (null = placeholder) */
  logoUrl: string | null;
}

/**
 * Amostra ao vivo das cores: sobrescreve as variáveis do tema só dentro do
 * quadro, então botões, badges e barras usam os componentes reais do app.
 */
export function BrandPreview({ primary, accent, crmName, clinicName, logoUrl }: BrandPreviewProps) {
  const themeVars = brandThemeVars(primary, accent) as CSSProperties;

  return (
    // puramente visual: inert tira os botões de exemplo do foco e dos leitores de tela
    <div style={themeVars} inert className="bg-background overflow-hidden rounded-xl border select-none">
      {/* cabeçalho, como na barra lateral */}
      <div className="bg-card flex items-center gap-3 border-b px-4 py-3">
        {logoUrl ? (
          <LogoPreview key={logoUrl} url={logoUrl} alt="" className="h-10 w-24 rounded-md" />
        ) : (
          <BrandMark size="sm" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-semibold">{crmName || "Nome do CRM"}</p>
          <p className="text-muted-foreground truncate text-xs">{clinicName || "Nome da clínica"}</p>
        </div>
        <BellIcon aria-hidden="true" className="text-muted-foreground ml-auto size-4 shrink-0" />
      </div>

      <div className="grid gap-4 p-4">
        {/* navegação: item ativo + badge de novos leads */}
        <div className="bg-card grid gap-1 rounded-lg border p-1.5 text-sm">
          <span className="bg-primary text-primary-foreground flex items-center gap-2 rounded-md px-2.5 py-1.5 font-medium">
            <LayoutDashboardIcon aria-hidden="true" className="size-4" />
            Dashboard
          </span>
          <span className="text-foreground flex items-center gap-2 rounded-md px-2.5 py-1.5">
            <UsersIcon aria-hidden="true" className="text-muted-foreground size-4" />
            Leads
            <Badge variant="gold" className="ml-auto tabular-nums">
              3 novos
            </Badge>
          </span>
        </div>

        {/* KPI com destaque */}
        <div className="bg-card rounded-lg border p-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
              <CalendarCheckIcon aria-hidden="true" className="size-3.5" />
            </span>
            Taxa de agendamento
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">38%</p>
          <Progress value={38} className="mt-2 h-1.5" />
          <p className="text-muted-foreground mt-1.5 text-xs tabular-nums">
            <span className="text-primary font-medium">18</span> de 47 leads agendados
          </p>
        </div>

        {/* ações */}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm">
            Salvar lead
          </Button>
          <Button type="button" size="sm" variant="outline">
            Cancelar
          </Button>
          <Badge>admin</Badge>
          <Badge variant="secondary">dentista</Badge>
          <span className="text-primary text-sm font-medium underline underline-offset-4">Ver detalhes</span>
        </div>
      </div>
    </div>
  );
}
