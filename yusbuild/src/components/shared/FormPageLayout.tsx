import * as React from "react";
import { Link, useBeforeUnload } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InlineLoader } from "./Loaders";
import { PageHeader } from "./PageHeader";

/**
 * Scaffold for a create/edit screen.
 *
 * The two prototype "New" pages were structurally identical — same two-column
 * grid, same aside, same footer, and a byte-identical success banner — which is
 * exactly the duplication this removes.
 *
 * Pair with react-hook-form. On a failed submit, feed the normalized error
 * through `applyFieldErrors` so backend validation lands on the right inputs:
 *
 *   catch (error) {
 *     const normalized = normalizeApiError(error);
 *     applyFieldErrors(normalized, form.setError);
 *   }
 */
export interface FormPageLayoutProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  backLink?: { to: string; label: string };
  /** Heading above the form fields. */
  formTitle?: React.ReactNode;
  /** The fields. */
  children: React.ReactNode;
  /** Secondary column — guidance, a checklist, a summary. */
  aside?: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelTo: string;
  cancelLabel?: string;
  /** Replaces the default Cancel/Submit pair. */
  footer?: React.ReactNode;
  /**
   * Warn before leaving with unsaved edits. Wire this to the form's
   * `formState.isDirty`.
   */
  isDirty?: boolean;
  className?: string;
}

export function FormPageLayout({
  title,
  description,
  eyebrow,
  backLink,
  formTitle,
  children,
  aside,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelTo,
  cancelLabel = "Cancel",
  footer,
  isDirty = false,
  className,
}: FormPageLayoutProps) {
  // Guards a full page unload only. In-app navigation away from a dirty form is
  // the router's concern and depends on the route setup, so it is left to the
  // caller rather than assumed here.
  useBeforeUnload(
    React.useCallback(
      (event: BeforeUnloadEvent) => {
        if (!isDirty || isSubmitting) return;
        event.preventDefault();
      },
      [isDirty, isSubmitting],
    ),
  );

  return (
    <div className={cn("space-y-6", className)}>
      <PageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        backLink={backLink}
      />

      <form onSubmit={onSubmit} noValidate>
        <div
          className={cn(
            "grid gap-6",
            aside && "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]",
          )}
        >
          <Card className="rounded-lg shadow-card">
            {formTitle ? (
              <CardHeader className="p-6 pb-0">
                <h2 className="text-h3">{formTitle}</h2>
              </CardHeader>
            ) : null}
            <CardContent className="space-y-4 p-6">{children}</CardContent>
          </Card>

          {aside ? <div className="space-y-4">{aside}</div> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          {footer ?? (
            <>
              <Button asChild variant="outline" type="button">
                <Link to={cancelTo}>{cancelLabel}</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <InlineLoader label={submitLabel} />
                ) : (
                  submitLabel
                )}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * Confirmation shown after a successful create or update.
 *
 * Both prototype form pages had this inline and identical.
 */
export function SuccessBanner({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      // `status` rather than `alert`: this is a successful outcome, so it
      // should be announced politely rather than interrupting.
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-success/30 bg-success-muted p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-body font-medium text-success-muted-foreground">
          {title}
        </p>
        {description ? (
          <p className="text-caption text-success-muted-foreground/80">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
