import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 404 page.
 *
 * The router previously redirected every unmatched path to /dashboard, which
 * silently swallowed typos and broken links and made them undebuggable. Showing
 * the failed path is what turns "it just went to the dashboard" into a
 * reportable bug.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileQuestion
          className="h-8 w-8 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-1">
        <h1 className="text-h1">Page not found</h1>
        <p className="max-w-prose text-body text-muted-foreground">
          We could not find{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-caption">
            {window.location.pathname}
          </code>
          . It may have moved, or the link may be out of date.
        </p>
      </div>

      <Button asChild className="mt-2">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
