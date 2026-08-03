import { Link, useMatches } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Breadcrumb trail, derived from route `handle` metadata.
 *
 * Routes opt in by exporting a crumb function:
 *
 *   <Route
 *     path=":projectId"
 *     element={<ProjectDetailPage />}
 *     handle={{ crumb: (match) => ({ label: `Project ${match.params.projectId}` }) }}
 *   />
 *
 * Resolving `:projectId` to a project *name* needs server data the shell must
 * not own — importing a domain hook here would break the no-cross-domain rule.
 * Instead the domain team's crumb function reads from the React Query cache:
 *
 *   crumb: (match) => ({
 *     label:
 *       queryClient.getQueryData(projectKeys.detail(match.params.projectId))?.name
 *       ?? `Project ${match.params.projectId}`,
 *   })
 *
 * The id fallback means the trail still renders before the data arrives.
 */

export interface Crumb {
  label: string;
  /** Omit to render as plain text, e.g. for the current page. */
  to?: string;
}

type CrumbFn = (match: ReturnType<typeof useMatches>[number]) => Crumb | null;

interface RouteHandle {
  crumb?: CrumbFn;
}

function hasCrumb(handle: unknown): handle is Required<RouteHandle> {
  return (
    typeof handle === "object" &&
    handle !== null &&
    typeof (handle as RouteHandle).crumb === "function"
  );
}

export function Breadcrumbs({ className }: { className?: string }) {
  const matches = useMatches();

  const crumbs = matches.flatMap((match) => {
    if (!hasCrumb(match.handle)) return [];
    const crumb = match.handle.crumb(match);
    return crumb ? [{ ...crumb, key: match.id }] : [];
  });

  // A single crumb is just the page title, which the page already shows.
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1 text-caption text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.key} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  className="h-3 w-3 shrink-0 opacity-50"
                  aria-hidden="true"
                />
              ) : null}

              {isLast || !crumb.to ? (
                <span
                  className={cn("truncate", isLast && "text-foreground")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="truncate rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
