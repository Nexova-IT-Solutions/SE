import { Skeleton } from "@/components/ui/skeleton";

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <Skeleton className="h-8 w-72 rounded bg-[#F3EDF1]" />
        <Skeleton className="mt-3 h-4 w-96 rounded bg-[#F3EDF1]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-gray-100 bg-white p-6 space-y-4">
            <Skeleton className="h-4 w-32 rounded bg-[#F3EDF1]" />
            <Skeleton className="h-8 w-40 rounded bg-[#F3EDF1]" />
            <Skeleton className="h-4 w-28 rounded bg-[#F3EDF1]" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-56 rounded bg-[#F3EDF1]" />
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 space-y-4">
          <Skeleton className="mx-auto h-16 w-16 rounded-full bg-[#F3EDF1]" />
          <Skeleton className="mx-auto h-4 w-40 rounded bg-[#F3EDF1]" />
          <Skeleton className="mx-auto h-4 w-64 rounded bg-[#F3EDF1]" />
          <Skeleton className="mx-auto h-12 w-40 rounded-full bg-[#F3EDF1]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-24 rounded bg-[#F3EDF1]" />
          <Skeleton className="h-4 w-3/4 rounded bg-[#F3EDF1]" />
          <Skeleton className="h-3 w-32 rounded bg-[#F3EDF1]" />
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-24 rounded bg-[#F3EDF1]" />
          <Skeleton className="h-4 w-3/4 rounded bg-[#F3EDF1]" />
          <Skeleton className="h-3 w-32 rounded bg-[#F3EDF1]" />
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <Skeleton className="h-6 w-48 rounded bg-[#F3EDF1]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <Skeleton className="aspect-square bg-[#F3EDF1]" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded bg-[#F3EDF1]" />
                <Skeleton className="h-4 w-1/2 rounded bg-[#F3EDF1]" />
                <Skeleton className="h-4 w-2/3 rounded bg-[#F3EDF1]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProfileLoading() {
  return <ProfileSkeleton />
}
