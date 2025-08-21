import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-8 p-3 w-full">
      <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex justify-center place-items-center gap-5 mb-6 mt-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}
