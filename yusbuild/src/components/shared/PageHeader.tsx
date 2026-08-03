import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Page title block.
 *
 * Additive changes only — this was already used by every screen, so the
 * original prop shape still works. `description` became optional and a
 * ReactNode, and `backLink` absorbs the back-navigation pattern that had been
 * copy-pasted onto five detail pages.
 */
export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small uppercase label above the title, e.g. the parent record's name. */
  eyebrow?: React.ReactNode;
  /** Status pill or similar, rendered beside the title. */
  badge?: React.ReactNode;
  /** Back navigation above the title. Replaces the hand-rolled BackLink. */
  backLink?: { to: string; label: string };
  /** Primary page actions. */
  actions?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  badge,
  backLink,
  actions,
  isLoading = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 border-b pb-5", className)}>
      {backLink ? (
        <Button asChild variant="ghost" size="sm" className="-ml-3 w-fit">
          <Link to={backLink.to}>
            <ArrowLeft aria-hidden="true" />
            {backLink.label}
          </Link>
        </Button>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="text-overline text-brand">{eyebrow}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-h1 text-foreground">{title}</h1>
            )}
            {badge}
          </div>

          {isLoading ? (
            <Skeleton className="h-4 w-96 max-w-full" />
          ) : description ? (
            <div className="max-w-3xl text-body text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
