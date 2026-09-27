import { StarIcon } from "lucide-react";

import { formatDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { starFills } from "../lib/summary";

const SIZES = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
} as const;

export interface StarRatingProps {
  rating: number | null | undefined;
  size?: keyof typeof SIZES;
  /** Cor da parte vazia (ex.: sobre fundo teal use "text-white/25") */
  emptyClassName?: string;
  className?: string;
}

/** Cinco estrelas com preenchimento parcial (4,9 → a última estrela 90% dourada). */
export function StarRating({ rating, size = "md", emptyClassName, className }: StarRatingProps) {
  const fills = starFills(rating);
  const iconClass = cn("shrink-0", SIZES[size]);

  return (
    <span
      role="img"
      aria-label={rating == null ? "Sem nota" : `Nota ${formatDecimal(rating)} de 5`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {fills.map((fill, index) => (
        <span key={index} aria-hidden="true" className="relative inline-flex shrink-0">
          <StarIcon className={cn(iconClass, "text-muted-foreground/25", emptyClassName)} fill="currentColor" strokeWidth={0} />
          {fill > 0 ? (
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarIcon className={cn(iconClass, "text-gold max-w-none")} fill="currentColor" strokeWidth={0} />
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
