import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-40 w-40 rounded-xl" />
        <div className="space-y-2 w-72">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  );
}
