import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic section skeleton for featured and best seller products
 */
export function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-[#F3EDF1]" />
        <div className="h-4 w-80 rounded bg-[#F3EDF1]" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-2xl border border-brand-border bg-white">
            <div className="aspect-square bg-[#F3EDF1]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 rounded bg-[#F3EDF1]" />
              <div className="h-5 w-1/2 rounded bg-[#F3EDF1]" />
              <div className="h-4 w-1/3 rounded bg-[#F3EDF1]" />
              <div className="h-10 w-full rounded bg-[#F3EDF1]" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
