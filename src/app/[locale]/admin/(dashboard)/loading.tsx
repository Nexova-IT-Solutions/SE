import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="w-full bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-8 px-4 md:px-8 lg:px-10">
        
        {/* Header Skeleton */}
        <div className="flex flex-wrap justify-between items-end gap-4 border-b border-brand-border pb-6">
          <div className="space-y-2">
             <Skeleton className="h-8 w-64 skeleton-shimmer" />
             <Skeleton className="h-4 w-56 skeleton-shimmer" />
          </div>
          <Skeleton className="h-12 w-36 rounded-xl skeleton-shimmer" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border border-brand-border bg-white rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
                <Skeleton className="h-3 w-20 skeleton-shimmer" />
                <Skeleton className="h-5 w-5 rounded-full skeleton-shimmer" />
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                <Skeleton className="h-8 w-24 skeleton-shimmer" />
                <Skeleton className="h-3 w-32 skeleton-shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <Skeleton className="h-4 w-32 skeleton-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[136px] rounded-2xl border border-brand-border skeleton-shimmer" />
            ))}
          </div>
        </section>

        {/* Modules Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl border border-brand-border skeleton-shimmer" />
          ))}
        </div>

        <div className="rounded-2xl border border-brand-border bg-white px-4 py-3">
          <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
        </div>

      </div>
    </div>
  );
}
