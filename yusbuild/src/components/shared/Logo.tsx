import { cn } from "@/lib/utils";

interface LogoProps {
  /** Show the "YusBuild" wordmark beside the mark. */
  withText?: boolean;
  /**
   * Show the tagline under the wordmark. Off by default: it is long enough to
   * wrap and crowd a compact topbar, so only roomy surfaces (the login page,
   * the mobile drawer header) should opt in.
   */
  withTagline?: boolean;
  className?: string;
}

export function Logo({
  withText = false,
  withTagline = false,
  className,
}: LogoProps) {
  const showTagline = withText && withTagline;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        role="img"
        // When the wordmark is visible the label would be read twice, so the
        // mark becomes decorative and the text carries the name.
        aria-label={withText ? undefined : "YusBuild"}
        aria-hidden={withText ? true : undefined}
      >
        <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
        <path
          d="M9 9L16 17V25H19V17L26 9H21.5L16 15.5L10.5 9H9Z"
          fill="hsl(var(--primary-foreground))"
        />
      </svg>

      {withText ? (
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground">
            YusBuild
          </p>
          {showTagline ? (
            <p className="text-caption leading-tight text-muted-foreground">
              Construction Foundation Management Platform
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
