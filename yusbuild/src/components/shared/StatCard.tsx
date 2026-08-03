import * as React from "react";
import { Link } from "react-router-dom";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A single headline metric.
 *
 * Replaces roughly fourteen hand-written Card blocks that had drifted into
 * three incompatible shapes. Two details are load-bearing:
 *
 * - `value` is a ReactNode, not a string. Some tiles show a StatusBadge rather
 *   than a number.
 * - `isLoading` is built in. Without it every caller writes its own skeleton,
 *   which is how the three variants appeared in the first place.
 */

/**
 * Two families, deliberately kept apart:
 *
 *   Semantic  — the value carries a judgement. `success` for healthy,
 *               `warning` for needs-attention, `destructive` for a problem.
 *   Decorative— blue/green/purple/orange, purely to tell tiles apart at a
 *               glance. This is what the client's dashboard reference uses:
 *               "Projects", "Total Piles" and "Total Steel" are not good or
 *               bad, they are just different.
 *
 * Reaching for `success` when you only want a green chip is the mistake this
 * split prevents — it tells the reader a number is healthy when nothing has
 * been evaluated.
 */
export type StatTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "blue"
  | "green"
  | "purple"
  | "orange";

const TONE_CHIP: Record<StatTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand-muted text-brand-muted-foreground",
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
  destructive: "bg-destructive-muted text-destructive-muted-foreground",
  // Decorative, drawn from the chart palette so a tile and its chart agree.
  blue: "bg-chart-1/10 text-chart-1",
  green: "bg-chart-2/10 text-chart-2",
  purple: "bg-chart-3/10 text-chart-3",
  orange: "bg-chart-4/10 text-chart-4",
};

export interface StatCardProps {
  label: string;
  /** ReactNode so a tile can show a badge or unit-suffixed markup, not just text. */
  value: React.ReactNode;
  /** Supporting line under the value, e.g. "Across all projects". */
  caption?: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Direction is stated separately from the number so it is not colour-only. */
  trend?: { value: string; direction: "up" | "down"; label?: string };
  isLoading?: boolean;
  /** Renders the whole tile as a link. */
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "neutral",
  trend,
  isLoading = false,
  href,
  className,
}: StatCardProps) {
  const body = (
    <CardContent className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-body font-medium text-muted-foreground">
          {label}
        </p>

        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          // tabular-nums keeps figures aligned across a row of tiles.
          <div className="text-metric tabular-nums text-foreground">
            {value}
          </div>
        )}

        {trend && !isLoading ? (
          <p
            className={cn(
              "flex items-center gap-1 text-caption",
              trend.direction === "up" ? "text-success" : "text-destructive",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
            )}
            {/* Spelled out so the meaning does not rely on colour or icon alone. */}
            <span className="sr-only">
              {trend.direction === "up" ? "Up" : "Down"}
            </span>
            {trend.value}
            {trend.label ? (
              <span className="text-muted-foreground">{trend.label}</span>
            ) : null}
          </p>
        ) : null}

        {caption && !isLoading ? (
          <p className="text-caption text-muted-foreground">{caption}</p>
        ) : null}
      </div>

      {Icon ? (
        <span
          className={cn("shrink-0 rounded-xl p-2.5", TONE_CHIP[tone])}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
    </CardContent>
  );

  const card = (
    <Card
      className={cn(
        "rounded-lg shadow-card",
        href &&
          "transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {body}
    </Card>
  );

  if (!href || isLoading) return card;

  return (
    <Link to={href} className="block rounded-lg">
      {card}
    </Link>
  );
}

/**
 * Responsive grid for a row of tiles. Two columns on mobile matches the
 * product design; four is the widescreen default.
 */
export function StatCardGrid({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
