"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OfflineIndicator } from "@/features/offline/offline-indicator";
import { HeaderBreadcrumb } from "./components/header-breadcrumb";
import { RealtimeStatus } from "./components/realtime-status";
import { ShellSidebarTrigger } from "./components/shell-sidebar-trigger";
import { NEW_LEAD_PATH, normalizePathname } from "./lib/navigation";

/** Header fixo do app: menu, título/trilha da página, status (offline, tempo real) e "Novo lead". */
export function AppHeader() {
  const pathname = usePathname();
  const onNewLeadPage = normalizePathname(pathname) === NEW_LEAD_PATH;

  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
      <ShellSidebarTrigger className="-ml-1.5" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
      <HeaderBreadcrumb className="flex-1" />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <OfflineIndicator />
        <RealtimeStatus />
        {onNewLeadPage ? null : (
          <Button asChild size="sm" className="shadow-sm max-sm:size-9">
            <Link href={NEW_LEAD_PATH} aria-label="Novo lead">
              <PlusIcon aria-hidden="true" />
              <span className="hidden sm:inline">Novo lead</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
