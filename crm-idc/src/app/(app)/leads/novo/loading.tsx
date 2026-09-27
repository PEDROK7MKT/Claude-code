import { FormSkeleton, PageHeaderSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeaderSkeleton withActions={false} announce={false} />
      <FormSkeleton fields={10} />
    </div>
  );
}
