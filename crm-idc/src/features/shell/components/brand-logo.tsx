import * as React from "react";
import Image from "next/image";

import { IDC_COLORS, IDC_MARK } from "@/features/offline/lib/brand-icon";
import { cn } from "@/lib/utils";

/** Monograma "iDC" do logo da clínica ("i" dourado, "DC" cinza), mesmo desenho do favicon. */
export function IdcMonogram({ className, ...props }: React.ComponentProps<"svg">) {
  const { dot, stem, d, c } = IDC_MARK;
  return (
    <svg viewBox="8 14 84 72" aria-hidden="true" focusable="false" className={className} {...props}>
      <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={IDC_COLORS.gold} />
      <path d={stem} fill={IDC_COLORS.gold} />
      <path d={d} fill={IDC_COLORS.gray} fillRule="evenodd" />
      <path d={c} fill={IDC_COLORS.gray} />
    </svg>
  );
}

const MARK_SIZES = {
  sm: { box: "size-8 rounded-lg", icon: "size-6" },
  md: { box: "size-10 rounded-xl", icon: "size-8" },
  lg: { box: "size-14 rounded-2xl", icon: "size-11" },
} as const;

export type BrandMarkSize = keyof typeof MARK_SIZES;

interface BrandMarkProps extends React.ComponentProps<"span"> {
  size?: BrandMarkSize;
  /** Logo enviado em Configurações (URL http(s) ou caminho relativo). */
  logoUrl?: string | null;
  /** Texto alternativo do logo (nome da clínica). */
  alt?: string;
}

/** Selo quadrado da marca: logo configurado ou o monograma "iDC" sobre grafite. */
export function BrandMark({ size = "md", logoUrl, alt = "", className, ...props }: BrandMarkProps) {
  const s = MARK_SIZES[size];

  if (logoUrl) {
    return (
      <span
        data-slot="brand-mark"
        className={cn("bg-card ring-border relative inline-flex shrink-0 overflow-hidden ring-1", s.box, className)}
        {...props}
      >
        {/* unoptimized: o logo pode estar em qualquer domínio (sem remotePatterns) */}
        <Image src={logoUrl} alt={alt} fill unoptimized sizes="56px" className="object-contain p-0.5" />
      </span>
    );
  }

  return (
    <span
      data-slot="brand-mark"
      aria-hidden={alt ? undefined : true}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className={cn("relative inline-flex shrink-0 items-center justify-center shadow-sm", s.box, className)}
      style={{ backgroundColor: IDC_COLORS.background }}
      {...props}
    >
      <IdcMonogram className={s.icon} />
    </span>
  );
}

interface BrandLogoProps extends React.ComponentProps<"div"> {
  logoUrl?: string | null;
  clinicName?: string;
  crmName?: string;
  /** `stacked`: logo acima do nome (login, páginas de erro); `inline`: lado a lado. */
  layout?: "stacked" | "inline";
}

/**
 * Logo completo. Com logo configurado mostra só a imagem (ela já traz o nome);
 * sem logo, o monograma "iDC" + "Instituto Décio Carrilho".
 */
export function BrandLogo({
  logoUrl,
  clinicName = "Instituto Décio Carrilho",
  crmName = "IDC CRM",
  layout = "stacked",
  className,
  ...props
}: BrandLogoProps) {
  if (logoUrl) {
    return (
      <div data-slot="brand-logo" className={cn("flex justify-center", className)} {...props}>
        <span className="relative block h-16 w-52 max-w-full">
          <Image src={logoUrl} alt={clinicName} fill unoptimized priority sizes="208px" className="object-contain" />
        </span>
      </div>
    );
  }

  const stacked = layout === "stacked";
  return (
    <div
      data-slot="brand-logo"
      className={cn("flex items-center", stacked ? "flex-col gap-3 text-center" : "gap-3", className)}
      {...props}
    >
      <BrandMark size={stacked ? "lg" : "md"} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-foreground text-base leading-tight font-semibold tracking-tight text-balance">{clinicName}</p>
        <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">{crmName}</p>
      </div>
    </div>
  );
}
