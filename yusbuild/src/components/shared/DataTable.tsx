import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { NormalizedError } from "@/lib/api/errors";
import { EmptyState, ErrorState } from "./EmptyState";
import { Pagination } from "./Pagination";

/**
 * Table for a paginated DRF list endpoint.
 *
 * Replaces five hand-built tables that shared no abstraction and had no
 * loading, empty, error, sorting or pagination handling between them.
 *
 * Two deliberate constraints:
 *
 * 1. Sorting and pagination are URL-driven, never internal. The component
 *    holds no such state — it emits DRF `ordering` strings and page numbers
 *    upward to useDataTableParams, which writes them to the URL.
 *
 * 2. Sorting is server-side only. With page size fixed at 50, sorting the
 *    current page client-side would order 50 of N rows and quietly mislead
 *    the reader.
 */

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Numeric columns should be right-aligned; this also applies tabular figures. */
  align?: "left" | "right";
  sortable?: boolean;
  /** The DRF field name to sort on. Defaults to `id`. */
  orderingKey?: string;
  /** Hide below this breakpoint. Essential for wide tables on small screens. */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string | number;
  /** Renders rows as links: middle-click and open-in-new-tab keep working. */
  rowHref?: (row: T) => string;
  isLoading?: boolean;
  /** A background refetch. Dims the body without replacing it with skeletons. */
  isFetching?: boolean;
  error?: NormalizedError | null;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  sorting?: {
    ordering: string | null;
    onOrderingChange: (ordering: string | null) => void;
  };
  pagination?: {
    page: number;
    count: number;
    onPageChange: (page: number) => void;
  };
  /** Screen-reader description of the table's contents. */
  caption: string;
  skeletonRows?: number;
  className?: string;
}

const HIDE_BELOW: Record<
  NonNullable<DataTableColumn<unknown>["hideBelow"]>,
  string
> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

/** Cycles a column through ascending → descending → unsorted. */
function nextOrdering(current: string | null, key: string): string | null {
  if (current === key) return `-${key}`;
  if (current === `-${key}`) return null;
  return key;
}

function sortStateFor(
  current: string | null,
  key: string,
): "ascending" | "descending" | "none" {
  if (current === key) return "ascending";
  if (current === `-${key}`) return "descending";
  return "none";
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowHref,
  isLoading = false,
  isFetching = false,
  error,
  onRetry,
  emptyState,
  sorting,
  pagination,
  caption,
  skeletonRows = 5,
  className,
}: DataTableProps<T>) {
  // Precedence matters: an error must win over stale rows, and a genuine empty
  // result must not be confused with "still loading".
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} size="sm" />;
  }

  const showSkeleton = isLoading && !rows;
  const isEmpty = !isLoading && rows?.length === 0;

  if (isEmpty) {
    return (
      <>
        {emptyState ?? (
          <EmptyState
            title="Nothing to show"
            description="No records match the current filters."
            size="sm"
          />
        )}
      </>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative w-full overflow-x-auto rounded-lg border",
          // A background refetch dims rather than blanks the table, so the
          // reader does not lose their place on every page change.
          isFetching && !showSkeleton && "opacity-60 transition-opacity",
        )}
      >
        <Table>
          <caption className="sr-only">{caption}</caption>

          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const key = column.orderingKey ?? column.id;
                const canSort = Boolean(column.sortable && sorting);
                const state = sorting
                  ? sortStateFor(sorting.ordering, key)
                  : "none";

                return (
                  <TableHead
                    key={column.id}
                    aria-sort={canSort ? state : undefined}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.hideBelow && HIDE_BELOW[column.hideBelow],
                      column.headerClassName,
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() =>
                          sorting?.onOrderingChange(
                            nextOrdering(sorting.ordering, key),
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          column.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {column.header}
                        {state === "ascending" ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : state === "descending" ? (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown
                            className="h-3 w-3 opacity-40"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
              {rowHref ? (
                <TableHead className="w-10">
                  <span className="sr-only">Open</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>

          <TableBody>
            {showSkeleton
              ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.hideBelow && HIDE_BELOW[column.hideBelow],
                        )}
                      >
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                    {rowHref ? (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              : rows?.map((row) => {
                  const href = rowHref?.(row);

                  return (
                    <TableRow
                      key={getRowId(row)}
                      className={href ? "cursor-pointer" : undefined}
                    >
                      {columns.map((column, columnIndex) => (
                        <TableCell
                          key={column.id}
                          className={cn(
                            // The first cell carries the row's identity.
                            columnIndex === 0 && "font-medium",
                            column.align === "right" &&
                              "text-right tabular-nums",
                            column.hideBelow && HIDE_BELOW[column.hideBelow],
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </TableCell>
                      ))}

                      {href ? (
                        <TableCell className="text-right">
                          {/* A real link, so middle-click, open-in-new-tab and
                              copy-link-address all work — engineers share
                              references to specific piles constantly. */}
                          <Link
                            to={href}
                            className="inline-flex rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span className="sr-only">Open</span>
                          </Link>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <Pagination
          page={pagination.page}
          count={pagination.count}
          onPageChange={pagination.onPageChange}
          isLoading={isLoading || isFetching}
        />
      ) : null}
    </div>
  );
}
