"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/** Abaixo de `md` (768px) o layout é considerado mobile. */
export const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
