"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { getBreadcrumbs } from "../lib/navigation";

/** Título/trilha da página atual no header (no celular, só o título). */
export function HeaderBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const items = getBreadcrumbs(pathname);
  if (items.length === 0) return <div className={className} />;

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem className={cn("min-w-0", !last && "hidden md:inline-flex")}>
                {last || !item.href ? (
                  <BreadcrumbPage className="text-foreground truncate font-semibold">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last ? <BreadcrumbSeparator className="hidden md:block" /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
