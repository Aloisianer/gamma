import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full m-5 p-5">
      <div className="flex items-start gap-5">
        <Skeleton className="h-40 w-40 rounded-xl" />
        <div className="flex flex-col gap-3 w-150">
          <Skeleton className="h-6 w-80" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
