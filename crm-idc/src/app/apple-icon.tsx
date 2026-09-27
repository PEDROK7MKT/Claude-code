import { ImageResponse } from "next/og";

import { PNG_ICON_SIZES, appIconDataUri } from "@/features/offline/lib/brand-icon";

/**
 * Ícones PNG gerados no build: /apple-icon/180.png (iOS), 192.png e 512.png (manifest,
 * "any" e "maskable"). Fundo sangrado — o iOS e o Android aplicam a própria máscara.
 */
export function generateImageMetadata() {
  return PNG_ICON_SIZES.map(({ id, size }) => ({
    id,
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function AppleIcon({ id }: { id: Promise<string | number> }) {
  const iconId = String(await id);
  const size = PNG_ICON_SIZES.find((icon) => icon.id === iconId)?.size ?? 180;

  return new ImageResponse(
    // ImageResponse (Satori) desenha o SVG da marca via <img> com data URI
    <img src={appIconDataUri("maskable")} width={size} height={size} alt="" />,
    { width: size, height: size },
  );
}
