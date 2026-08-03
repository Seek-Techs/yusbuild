import * as React from "react";
import {
  AlertTriangle,
  Ban,
  FileQuestion,
  Inbox,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NormalizedError } from "@/lib/api/errors";

/**
 * Empty and error states.
 *
 * Replaces PrototypeState, which rendered the same neutral icon for all four
 * of its states — an error was visually indistinguishable from an empty list —
 * and used a green check mark for "empty", which reads as success.
 */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Primary call to action, e.g. "New project". */
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** `sm` sits inside a card or table; `md` is a full-page state. */
  size?: "sm" | "md";
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed text-center",
        size === "sm" ? "gap-2 p-6" : "gap-3 p-10",
        className,
      )}
    >
      <span className="rounded-full bg-muted p-3" aria-hidden="true">
        <Icon
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "h-5 w-5" : "h-6 w-6",
          )}
        />
      </span>

      <div className="space-y-1">
        <p className={cn(size === "sm" ? "text-h3" : "text-h2")}>{title}</p>
        {description ? (
          <p className="mx-auto max-w-prose text-body text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {action || secondaryAction ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/** Maps an error kind to its presentation. */
export type ErrorVariant =
  "error" | "forbidden" | "notFound" | "conflict" | "offline";

const ERROR_PRESENTATION: Record<
  ErrorVariant,
  { icon: LucideIcon; title: string; chip: string }
> = {
  error: {
    icon: AlertTriangle,
    title: "Something went wrong",
    chip: "bg-destructive-muted text-destructive-muted-foreground",
  },
  forbidden: {
    icon: ShieldAlert,
    title: "You do not have access",
    chip: "bg-warning-muted text-warning-muted-foreground",
  },
  notFound: {
    icon: FileQuestion,
    title: "Not found",
    chip: "bg-muted text-muted-foreground",
  },
  conflict: {
    icon: Ban,
    title: "This action is no longer available",
    chip: "bg-warning-muted text-warning-muted-foreground",
  },
  offline: {
    icon: RefreshCw,
    title: "Cannot reach the server",
    chip: "bg-muted text-muted-foreground",
  },
};

/** Derive the variant from a normalized error, so callers rarely pass one. */
function variantForError(
  error: NormalizedError | null | undefined,
): ErrorVariant {
  switch (error?.kind) {
    case "forbidden":
      return "forbidden";
    case "notFound":
      return "notFound";
    case "conflict":
      return "conflict";
    case "network":
      return "offline";
    default:
      return "error";
  }
}

export interface ErrorStateProps {
  /** A normalized error. Its `kind` picks the variant and its message the body. */
  error?: NormalizedError | null;
  /** Override the derived variant. */
  variant?: ErrorVariant;
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function ErrorState({
  error,
  variant,
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  action,
  size = "md",
  className,
}: ErrorStateProps) {
  const resolved = variant ?? variantForError(error);
  const presentation = ERROR_PRESENTATION[resolved];
  const Icon = presentation.icon;

  // Retrying a 403 or a 409 just reproduces the same answer, so the affordance
  // is withheld rather than inviting a pointless round trip.
  const retryable =
    onRetry && resolved !== "forbidden" && resolved !== "conflict";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border text-center",
        size === "sm" ? "gap-2 p-6" : "gap-3 p-10",
        className,
      )}
    >
      <span
        className={cn("rounded-full p-3", presentation.chip)}
        aria-hidden="true"
      >
        <Icon className={cn(size === "sm" ? "h-5 w-5" : "h-6 w-6")} />
      </span>

      <div className="space-y-1">
        <p className={cn(size === "sm" ? "text-h3" : "text-h2")}>
          {title ?? presentation.title}
        </p>
        <p className="mx-auto max-w-prose text-body text-muted-foreground">
          {description ?? error?.message ?? "Please try again."}
        </p>
      </div>

      {retryable || action ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {retryable ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
