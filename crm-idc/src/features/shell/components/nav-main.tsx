"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  SettingsIcon,
  SquareKanbanIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/features/auth/session-context";
import { useNewLeadsCount } from "@/features/leads/api/leads-queries";
import { describeNewLeads, formatNavBadgeCount, getNavItems, isNavItemActive, type NavItem, type NavItemId } from "../lib/navigation";

const NAV_ICONS: Record<NavItemId, LucideIcon> = {
  dashboard: LayoutDashboardIcon,
  leads: UsersIcon,
  kanban: SquareKanbanIcon,
  "google-ads": ChartLineIcon,
  gmn: MapPinIcon,
  relatorios: FileTextIcon,
  configuracoes: SettingsIcon,
};

/** Menu principal da sidebar (spec §5), com o badge de novos leads em tempo real. */
export function NavMain() {
  const pathname = usePathname();
  const { isAdmin } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: newLeads } = useNewLeadsCount();

  // no celular o menu é um Sheet: fecha ao escolher um destino
  const handleNavigate = React.useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <nav aria-label="Navegação principal">
          <SidebarMenu>
            {getNavItems(isAdmin).map((item) => (
              <NavMainItem
                key={item.id}
                item={item}
                active={isNavItemActive(pathname, item.href)}
                badgeCount={item.id === "leads" ? (newLeads ?? 0) : 0}
                onNavigate={handleNavigate}
              />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface NavMainItemProps {
  item: NavItem;
  active: boolean;
  badgeCount: number;
  onNavigate: () => void;
}

function NavMainItem({ item, active, badgeCount, onNavigate }: NavMainItemProps) {
  const Icon = NAV_ICONS[item.id];
  const badge = formatNavBadgeCount(badgeCount);
  const badgeDescription = badge ? describeNewLeads(badgeCount) : null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={badgeDescription ? `${item.label} · ${badgeDescription}` : item.label}
        className="data-[active=true]:[&_svg]:text-primary h-9"
      >
        <Link href={item.href} aria-current={active ? "page" : undefined} onClick={onNavigate}>
          <span className="relative flex shrink-0">
            <Icon aria-hidden="true" className="size-4" />
            {badge ? (
              // recolhida em ícones: o número some, fica um ponto dourado
              <span
                aria-hidden="true"
                className="bg-gold ring-sidebar absolute -top-1 -right-1 hidden size-2 rounded-full ring-2 group-data-[collapsible=icon]:block"
              />
            ) : null}
          </span>
          <span>
            {item.label}
            {badgeDescription ? <span className="sr-only">, {badgeDescription}</span> : null}
          </span>
        </Link>
      </SidebarMenuButton>
      {badge ? (
        <SidebarMenuBadge
          key={badge}
          aria-hidden="true"
          className="bg-gold text-gold-foreground peer-hover/menu-button:text-gold-foreground peer-data-[active=true]/menu-button:text-gold-foreground animate-in zoom-in-50 top-2! rounded-full px-1.5 font-semibold shadow-sm duration-300"
        >
          {badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}
