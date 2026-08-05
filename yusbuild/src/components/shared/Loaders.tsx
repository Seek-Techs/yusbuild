import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared loading states.
 *
 * Prefer a skeleton over a spinner wherever the eventual layout is known — it
 * reserves the right space and avoids the content jump that a spinner causes.
 * Reserve spinners for indeterminate in-place waits, such as a pending button.
 */

/** Full-viewport loader. Use only for the initial auth/session bootstrap. */
export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-3"
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-body text-muted-foreground">{label}</p>
    </div>
  );
}

/** Inline spinner for buttons and small in-place waits. */
export function InlineLoader({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label ? <span className="text-body">{label}</span> : null}
      <span className="sr-only">Loading</span>
    </span>
  );
}

/**
 * Route-level Suspense fallback.
 *
 * Approximates a typical page — header block, then content — so lazy-loaded
 * routes do not flash an empty shell before painting.
 */
export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading page</span>
      <div className="space-y-2 border-b pb-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

/** Table-shaped fallback, sized to the real row height to avoid layout shift. */
export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div role="status" aria-live="polite" className="w-full space-y-3">
      <span className="sr-only">Loading table</span>
      <Skeleton className="h-10 w-full rounded-md" />
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-5 flex-1", colIndex === 0 && "flex-[2]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card-shaped fallback for stat tiles and panels. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("rounded-lg border bg-card p-4", className)}
    >
      <span className="sr-only">Loading</span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
    </div>
  );
}
