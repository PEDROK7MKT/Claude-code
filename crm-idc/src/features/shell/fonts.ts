import { Inter } from "next/font/google";

/**
 * Inter (spec §5), auto-hospedada pelo next/font. Exposta como `--font-inter`
 * (globals.css mapeia `--font-sans` para ela). Compartilhada entre o layout raiz
 * e o global-error, que renderiza o próprio <html>.
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
