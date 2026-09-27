import { PageSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return <PageSkeleton kpis={4} charts={4} tableRows={6} />;
}
