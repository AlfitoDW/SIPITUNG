import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Page skeletons
export function SkeletonPageHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-[80px]" />
      <Skeleton className="h-3 w-[100px]" />
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
  showHeader = true,
}: {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="rounded-xl border shadow-sm overflow-hidden">
      <div className="space-y-0">
        {showHeader && (
          <div className="flex items-center gap-4 px-4 py-3 bg-[#003580]">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 bg-white/30 flex-1" />
            ))}
          </div>
        )}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-4 flex-1"
                  style={{ width: j === 0 ? "40px" : "auto" }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

// Full page skeletons
export function SkeletonDashboard() {
  return (
    <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
      <SkeletonPageHeader />
      <SkeletonCards count={4} />
      <div className="space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTablePage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <SkeletonPageHeader />
        <Skeleton className="h-9 w-[120px]" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
      <SkeletonPageHeader />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border p-6 space-y-4">
            <Skeleton className="h-6 w-[200px]" />
            <SkeletonForm fields={4} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border p-6 space-y-4">
            <Skeleton className="h-6 w-[150px]" />
            <SkeletonList items={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonListPage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <SkeletonPageHeader />
        <Skeleton className="h-9 w-[120px]" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <SkeletonList items={5} />
      </div>
    </div>
  );
}
