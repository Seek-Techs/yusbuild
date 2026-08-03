import * as React from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

/**
 * Card wrapper for a chart.
 *
 * Owns the framing every chart needs and would otherwise reimplement: title,
 * optional "View all" link, fixed height, loading skeleton, empty state, and a
 * responsive container.
 *
 * `summary` is not optional in spirit — a chart is invisible to a screen
 * reader, so the component renders a visually-hidden text equivalent. Pass the
 * headline the chart is meant to convey, or a short data description.
 */
export interface ChartCardProps {
  title: string;
  description?: React.ReactNode;
  /** Screen-reader text equivalent. A chart alone conveys nothing to AT. */
  summary?: string;
  /** e.g. { to: "/projects", label: "View all" } */
  action?: { to: string; label: string };
  /** Body height. Recharts needs a bounded parent to size itself. */
  height?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: React.ReactElement;
}

export function ChartCard({
  title,
  description,
  summary,
  action,
  height = 288,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data to chart yet.",
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("rounded-lg shadow-card", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-h3 text-card-foreground">{title}</h3>
          {description ? (
            <p className="text-caption text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {action ? (
          <Link
            to={action.to}
            className="shrink-0 rounded-sm text-caption font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </Link>
        ) : null}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div style={{ height }}>
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-md" />
          ) : isEmpty ? (
            <EmptyState title={emptyMessage} size="sm" className="h-full" />
          ) : (
            <>
              {summary ? <p className="sr-only">{summary}</p> : null}
              {/* aria-hidden: the SVG is decorative once `summary` carries the
                  meaning; without this AT reads a stream of unlabelled paths. */}
              <div aria-hidden="true" className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  {children}
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
