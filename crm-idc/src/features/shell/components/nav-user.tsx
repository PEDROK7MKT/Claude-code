"use client";

import * as React from "react";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { useSession } from "@/features/auth/session-context";
import { ROLE_LABEL } from "@/lib/constants";
import { initials } from "@/lib/format";

/** Rodapé da sidebar: avatar com iniciais, nome, papel e "Sair". */
export function NavUser() {
  const { profile, email } = useSession();
  const { state, isMobile } = useSidebar();
  const { signOut, signingOut } = useSignOut();
  const roleLabel = ROLE_LABEL[profile.role];
  const name = profile.full_name || email || "Usuário";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2.5 rounded-md p-2 group-data-[collapsible=icon]:p-0">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              {/* recolhida: visualmente oculto, mas ainda lido por leitores de tela */}
              <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:sr-only">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">{roleLabel}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
            <p className="font-medium">{name}</p>
            <p className="opacity-80">{roleLabel}</p>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          tooltip="Sair"
          onClick={() => void signOut()}
          disabled={signingOut}
          aria-busy={signingOut}
          className="text-muted-foreground hover:text-destructive active:text-destructive h-9"
        >
          {signingOut ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : <LogOutIcon aria-hidden="true" />}
          <span>{signingOut ? "Saindo…" : "Sair"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
