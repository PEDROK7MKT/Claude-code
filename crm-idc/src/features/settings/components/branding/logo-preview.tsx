"use client";

import * as React from "react";
import Image from "next/image";

import { BrandMark } from "@/features/shell/components/brand-logo";
import { cn } from "@/lib/utils";

export type LogoStatus = "none" | "loading" | "loaded" | "error";

export interface LogoPreviewProps {
  /** URL já validada (null = sem logo → placeholder do dente) */
  url: string | null;
  alt: string;
  className?: string;
  onStatusChange?: (status: LogoStatus, size?: { width: number; height: number }) => void;
}

/**
 * Logo configurado com fallback: enquanto carrega ou se o endereço falhar,
 * mostra o selo padrão do IDC (placeholder do spec §12).
 * Remonte com `key={url}` para reiniciar o estado ao trocar de endereço.
 */
export function LogoPreview({ url, alt, className, onStatusChange }: LogoPreviewProps) {
  const [status, setStatus] = React.useState<LogoStatus>(url ? "loading" : "none");

  const report = (next: LogoStatus, size?: { width: number; height: number }) => {
    setStatus(next);
    onStatusChange?.(next, size);
  };

  const showImage = url && status !== "error";

  return (
    <span
      className={cn(
        "bg-card ring-border relative flex h-16 w-40 max-w-full shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1",
        className,
      )}
    >
      {showImage ? (
        // unoptimized: o logo pode estar em qualquer domínio (sem remotePatterns), como no layout
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          sizes="160px"
          className={cn("object-contain p-2 transition-opacity", status === "loaded" ? "opacity-100" : "opacity-0")}
          onLoad={(event) => {
            const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
            // imagem que falhou antes da hidratação chega aqui com 0×0
            if (width === 0) report("error");
            else report("loaded", { width, height });
          }}
          onError={() => report("error")}
        />
      ) : null}
      {status !== "loaded" ? <BrandMark size="md" className={cn(status === "loading" && "animate-pulse")} /> : null}
    </span>
  );
}
