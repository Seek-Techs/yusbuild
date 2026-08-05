import * as React from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A bordered title/description block.
 *
 * This shape appeared roughly fourteen times across the prototype — review
 * queues, calculation history, checklists, guidance panels — each written out
 * by hand with slightly different spacing.
 */
export interface InfoTileProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** Right-aligned slot: a badge, a timestamp, a small action. */
  trailing?: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "info" | "destructive";
  /** Renders the tile as a link. */
  href?: string;
  className?: string;
}

const TONE_BORDER: Record<NonNullable<InfoTileProps["tone"]>, string> = {
  neutral: "border-border",
  brand: "border-brand/30 bg-brand-muted/40",
  success: "border-success/30 bg-success-muted/40",
  warning: "border-warning/30 bg-warning-muted/40",
  info: "border-info/30 bg-info-muted/40",
  destructive: "border-destructive/30 bg-destructive-muted/40",
};

export function InfoTile({
  title,
  description,
  icon: Icon,
  trailing,
  tone = "neutral",
  href,
  className,
}: InfoTileProps) {
  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        TONE_BORDER[tone],
        href && "transition-colors hover:border-brand/40",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-body font-medium text-foreground">{title}</div>
        {description ? (
          <div className="text-caption text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );

  if (!href) return content;

  return (
    <Link
      to={href}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

/** Vertical stack of tiles. */
export function InfoTileList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

/**
 * Label/value pairs for record attributes — pile type, diameter, drawing
 * reference, and so on.
 */
export function DescriptionList({
  items,
  columns = 2,
  className,
}: {
  items: { label: string; value: React.ReactNode }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-0.5">
          <dt className="text-caption text-muted-foreground">{item.label}</dt>
          <dd className="text-body font-medium text-foreground">
            {item.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
