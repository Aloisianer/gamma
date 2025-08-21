import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-8 w-full">
      <div className="w-1/3 sticky top-0 left-1/2 transform -translate-x-1/2 m-3">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
