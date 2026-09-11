import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-base-800/60 shimmer border border-base-750/40",
        className
      )}
    />
  );
}

export function PanelSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={cn("panel p-5 space-y-4", height)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
