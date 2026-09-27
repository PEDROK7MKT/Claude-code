"use client";

import * as React from "react";
import { MenuIcon, PanelLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Botão do header que abre/recolhe a sidebar: hambúrguer no celular (abre o Sheet),
 * ícone de painel no tablet/desktop (alterna ícones ↔ expandida). Atalho: Ctrl/⌘ + B.
 */
export function ShellSidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar, isMobile, open, openMobile } = useSidebar();
  const expanded = isMobile ? openMobile : open;
  const label = isMobile ? "Abrir menu de navegação" : open ? "Recolher menu lateral" : "Expandir menu lateral";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-sidebar="trigger"
          aria-label={label}
          aria-expanded={expanded}
          onClick={toggleSidebar}
          className={cn("text-muted-foreground hover:text-foreground size-9 md:size-8", className)}
        >
          <MenuIcon aria-hidden="true" className="size-5 md:hidden" />
          <PanelLeftIcon aria-hidden="true" className="hidden md:block" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" hidden={isMobile}>
        {label} <kbd className="ml-1 font-sans opacity-70">Ctrl+B</kbd>
      </TooltipContent>
    </Tooltip>
  );
}
