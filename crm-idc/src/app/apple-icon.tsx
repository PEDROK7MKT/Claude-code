import { ImageResponse } from "next/og";

import { IDC_COLORS, IDC_MARK_RATIO, PNG_ICON_SIZES, markPngDataUri } from "@/features/offline/lib/brand-icon";

/**
 * Ícones PNG gerados no build: /apple-icon/180.png (iOS), 192.png e 512.png (manifest,
 * "any" e "maskable"). Monograma do logo original sobre branco, dentro da zona segura.
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
  const markWidth = Math.round(size * 0.66);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: IDC_COLORS.background,
        }}
      >
        {/* ImageResponse (Satori) desenha o PNG do monograma via <img> com data URI */}
        <img src={markPngDataUri()} width={markWidth} height={Math.round(markWidth / IDC_MARK_RATIO)} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
