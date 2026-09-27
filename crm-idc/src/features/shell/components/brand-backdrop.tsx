import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Fundo decorativo "clean" das telas fora do app (login, erros): cinza claro com
 * brilho teal suave, textura de pontos esmaecida e um toque dourado. Puramente visual.
 */
export function BrandBackdrop({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="brand-backdrop"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      {...props}
    >
      {/* brilho teal no topo */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_65%)]" />
      {/* textura de pontos, some nas bordas */}
      <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--primary)_14%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)] bg-size-[22px_22px]" />
      {/* manchas de cor */}
      <div className="bg-primary/10 absolute -top-32 -left-24 size-80 rounded-full blur-3xl" />
      <div className="bg-gold/20 absolute -right-24 -bottom-28 size-80 rounded-full blur-3xl" />
      {/* filete dourado no rodapé */}
      <div className="via-gold/60 absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
