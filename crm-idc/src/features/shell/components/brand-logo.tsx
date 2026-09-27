import * as React from "react";
import Image from "next/image";

import { IDC_COLORS, IDC_LOGO_URL, IDC_MARK_URL } from "@/features/offline/lib/brand-icon";
import { cn } from "@/lib/utils";

/** Monograma "iDC" recortado do logo original (public/brand/idc-mark.png, ≈ 2:1). */
export function IdcMonogram({ className, ...props }: Omit<React.ComponentProps<typeof Image>, "src" | "alt">) {
  return (
    <Image
      src={IDC_MARK_URL}
      alt=""
      width={400}
      height={201}
      aria-hidden="true"
      className={cn("h-auto object-contain", className)}
      {...props}
    />
  );
}

const MARK_SIZES = {
  sm: { box: "size-8 rounded-lg", icon: "w-[26px]" },
  md: { box: "size-10 rounded-xl", icon: "w-8" },
  lg: { box: "size-14 rounded-2xl", icon: "w-11" },
} as const;

export type BrandMarkSize = keyof typeof MARK_SIZES;

interface BrandMarkProps extends React.ComponentProps<"span"> {
  size?: BrandMarkSize;
  /** Logo enviado em Configurações (URL http(s) ou caminho relativo). */
  logoUrl?: string | null;
  /** Texto alternativo do logo (nome da clínica). */
  alt?: string;
}

/** Selo quadrado da marca: logo configurado ou o monograma "iDC" do logo original sobre branco. */
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
        "ring-border relative inline-flex shrink-0 items-center justify-center shadow-sm ring-1",
        s.box,
        className,
      )}
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
 * Logo completo. Com logo configurado em Configurações mostra essa imagem; senão o logo
 * original do IDC ("stacked", com o slogan) ou o monograma + nome da clínica ("inline").
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

  if (layout === "stacked") {
    return (
      <div data-slot="brand-logo" className={cn("flex flex-col items-center gap-2 text-center", className)} {...props}>
        <Image
          src={IDC_LOGO_URL}
          alt={clinicName}
          width={562}
          height={348}
          priority
          className="h-auto w-56 max-w-full object-contain"
        />
        <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">{crmName}</p>
      </div>
    );
  }

  return (
    <div data-slot="brand-logo" className={cn("flex items-center gap-3", className)} {...props}>
      <BrandMark size="md" />
      <div className="min-w-0 space-y-0.5">
        <p className="text-foreground text-base leading-tight font-semibold tracking-tight text-balance">{clinicName}</p>
        <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">{crmName}</p>
      </div>
    </div>
  );
}
