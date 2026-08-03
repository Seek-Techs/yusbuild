import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, totalPages } from "@/types/api";

/**
 * Pagination for a DRF list endpoint.
 *
 * NOTE: there is deliberately no page-size selector. The backend fixes page
 * size at 50 and exposes no `page_size` query parameter, so offering the
 * control would be a lie in the UI. See src/types/api.ts.
 */
export interface PaginationProps {
  page: number;
  /** `count` from the DRF envelope — total rows, not pages. */
  count: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  page,
  count,
  onPageChange,
  pageSize = PAGE_SIZE,
  isLoading = false,
  className,
}: PaginationProps) {
  const pageCount = totalPages(count, pageSize);

  // A single page of results needs no controls.
  if (count === 0 || pageCount <= 1) return null;

  // A shared link can carry a page that no longer exists — the result set may
  // have shrunk, or the recipient may have different permissions. Clamp so the
  // controls stay usable instead of reporting "showing 301–350 of 40".
  const safePage = Math.min(Math.max(1, page), pageCount);
  const first = (safePage - 1) * pageSize + 1;
  const last = Math.min(safePage * pageSize, count);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className,
      )}
    >
      {/* aria-live so the range is announced after a page change, which is
          otherwise a silent content swap. */}
      <p className="text-caption text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{first}</span>–
        <span className="font-medium text-foreground">{last}</span> of{" "}
        <span className="font-medium text-foreground">{count}</span>
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1 || isLoading}
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>

        <span className="px-2 text-caption tabular-nums text-muted-foreground">
          Page {safePage} of {pageCount}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pageCount || isLoading}
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}
