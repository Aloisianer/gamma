import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-6 w-52" />
      <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
        {Array.from({ length: 28 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
