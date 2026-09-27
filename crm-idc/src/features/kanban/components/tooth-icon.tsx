import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Dente no traço do lucide (24×24, stroke 2) — o lucide não tem ícone de dente
 * e o card da spec §12 usa 🦷 para o serviço.
 */
export function ToothIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("size-4 shrink-0", className)}
      {...props}
    >
      <path d="M12 5.5C10.6 4.4 9.5 3.5 7.6 3.5 5 3.5 3.5 5.6 3.5 8.2c0 2.5 1 3.9 1.5 5.9.6 2.4.9 6.4 2.9 6.4 1.6 0 1.8-2.2 2.2-4 .3-1.4.8-2.6 1.9-2.6s1.6 1.2 1.9 2.6c.4 1.8.6 4 2.2 4 2 0 2.3-4 2.9-6.4.5-2 1.5-3.4 1.5-5.9 0-2.6-1.5-4.7-4.1-4.7-1.9 0-3 .9-4.4 2Z" />
      <path d="M9.5 7.2c.9.4 1.7.6 2.5.6s1.6-.2 2.5-.6" />
    </svg>
  );
}
