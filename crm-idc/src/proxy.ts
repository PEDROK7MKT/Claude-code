import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Tudo, exceto assets estáticos, imagens, service worker, manifest, o script de
    // rastreamento do site da clínica e o webhook público (não precisam de sessão)
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js|idc-lead-tracker\\.js|manifest.webmanifest|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
