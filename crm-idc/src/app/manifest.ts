import type { MetadataRoute } from "next";

import { buildWebManifest } from "@/features/offline/lib/web-manifest";

/** /manifest.webmanifest — instalação como app (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return buildWebManifest();
}
