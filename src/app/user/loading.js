import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-8 p-3 w-full space-y-6">
      <Skeleton className="h-5 w-60" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between w-50">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-16 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
