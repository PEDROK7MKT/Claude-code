import type { Metadata } from "next";

import { GoogleAdsView } from "@/features/google-ads/components/google-ads-view";

export const metadata: Metadata = {
  title: "Google Ads",
};

/** /google-ads — métricas diárias do Google Ads × leads reais do CRM (admin lança; dentista visualiza). */
export default function GoogleAdsPage() {
  return <GoogleAdsView />;
}
