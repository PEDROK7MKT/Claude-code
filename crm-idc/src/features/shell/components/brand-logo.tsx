import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/** Silhueta de dente (marca do IDC enquanto não há logo — spec §12 "usar placeholder"). */
export function ToothIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M7.4 3.2C4.9 3.2 3.3 5.2 3.3 7.8c0 2.1.7 3.5 1.3 4.9.6 1.5.9 3.2 1.2 5.2.3 1.9.9 3.1 2 3.1 1.2 0 1.6-1.3 1.9-2.9.3-1.8.8-3.1 2.3-3.1s2 1.3 2.3 3.1c.3 1.6.7 2.9 1.9 2.9 1.1 0 1.7-1.2 2-3.1.3-2 .6-3.7 1.2-5.2.6-1.4 1.3-2.8 1.3-4.9 0-2.6-1.6-4.6-4.1-4.6-1.9 0-2.8 1-4.6 1s-2.7-1-4.6-1Z" />
      <path d="M8.2 7.1c.6-.5 1.4-.6 2.1-.3" opacity={0.55} />
    </svg>
  );
}

const MARK_SIZES = {
  sm: { box: "size-8 rounded-lg", icon: "size-[18px]", dot: "size-1.5 top-1 right-1" },
  md: { box: "size-10 rounded-xl", icon: "size-[22px]", dot: "size-2 top-1.5 right-1.5" },
  lg: { box: "size-14 rounded-2xl", icon: "size-8", dot: "size-2.5 top-2 right-2" },
} as const;

export type BrandMarkSize = keyof typeof MARK_SIZES;

interface BrandMarkProps extends React.ComponentProps<"span"> {
  size?: BrandMarkSize;
  /** Logo enviado em Configurações (URL http(s) ou caminho relativo). */
  logoUrl?: string | null;
  /** Texto alternativo do logo (nome da clínica). */
  alt?: string;
}

/** Selo quadrado da marca: logo configurado ou dente branco sobre o teal com detalhe dourado. */
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
      className={cn(
        "bg-primary text-primary-foreground relative inline-flex shrink-0 items-center justify-center shadow-sm",
        "bg-[linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary)_78%,black))]",
        s.box,
        className,
      )}
      {...props}
    >
      <ToothIcon className={s.icon} />
      <span className={cn("bg-gold ring-primary absolute rounded-full ring-2", s.dot)} />
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
 * sem logo, o selo do dente + "Instituto Décio Carrilho".
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
