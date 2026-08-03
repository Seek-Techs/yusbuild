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
  /** Render for a dark surface, e.g. the navy topbar. */
  onDark?: boolean;
  className?: string;
}

/**
 * The YusBuild mark: stacked vertical bars forming a tower silhouette, after
 * the client's design reference.
 *
 * Approximated in SVG rather than imported as an asset. If the client supplies
 * the original artwork, replace the paths below — nothing else needs to change.
 */
export function Logo({
  withText = false,
  withTagline = false,
  onDark = false,
  className,
}: LogoProps) {
  const showTagline = withText && withTagline;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        role="img"
        // With the wordmark visible the name would be announced twice, so the
        // mark becomes decorative and the text carries it.
        aria-label={withText ? undefined : "YusBuild"}
        aria-hidden={withText ? true : undefined}
      >
        <rect
          width="32"
          height="32"
          rx="7"
          className={onDark ? "fill-white" : "fill-primary"}
        />
        {/* Three towers of differing height, with window slots — a building
            elevation rather than a literal letterform. */}
        <g className={onDark ? "fill-topbar" : "fill-primary-foreground"}>
          <rect x="7" y="13" width="4.5" height="12" rx="1" />
          <rect x="13.75" y="7" width="4.5" height="18" rx="1" />
          <rect x="20.5" y="11" width="4.5" height="14" rx="1" />
        </g>
        {/* Window slots, punched through in the plate colour. */}
        <g className={onDark ? "fill-white" : "fill-primary"} opacity="0.9">
          <rect x="15.25" y="10" width="1.5" height="1.5" rx="0.4" />
          <rect x="15.25" y="13.5" width="1.5" height="1.5" rx="0.4" />
          <rect x="8.5" y="16" width="1.5" height="1.5" rx="0.4" />
          <rect x="22" y="14.5" width="1.5" height="1.5" rx="0.4" />
        </g>
      </svg>

      {withText ? (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-lg font-semibold leading-tight tracking-tight",
              onDark ? "text-topbar-foreground" : "text-foreground",
            )}
          >
            YusBuild
          </p>
          {showTagline ? (
            <p
              className={cn(
                "text-caption leading-tight",
                onDark ? "text-topbar-foreground/70" : "text-muted-foreground",
              )}
            >
              Pile Reinforcement · Quantification · BOQ
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
