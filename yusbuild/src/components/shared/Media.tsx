import * as React from "react";
import { ImageOff, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Images with a loading and a failure state.
 *
 * A bare `<img>` is not enough here: project photos and site evidence come from
 * user uploads, so a missing or broken file is routine rather than exceptional.
 * Left unhandled that renders a broken-image glyph and collapses the layout.
 */

const RATIO_CLASS = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[3/1]",
  photo: "aspect-[4/3]",
} as const;

export interface MediaProps {
  src?: string | null;
  /**
   * Describe the content, not the file. Pass "" for purely decorative images
   * so screen readers skip them rather than reading a filename.
   */
  alt: string;
  ratio?: keyof typeof RATIO_CLASS;
  /** Shown when there is no src, or the file fails to load. */
  fallbackIcon?: LucideIcon;
  fallbackLabel?: string;
  /** Overlaid at the bottom, e.g. a status pill on a project hero. */
  overlay?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Media({
  src,
  alt,
  ratio = "photo",
  fallbackIcon: FallbackIcon = ImageOff,
  fallbackLabel,
  overlay,
  className,
  style,
}: MediaProps) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error",
  );

  // A changed src is a new image, so the previous one's status must not stick.
  const [lastSrc, setLastSrc] = React.useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setStatus(src ? "loading" : "error");
  }

  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        // An explicit size wins over the aspect ratio.
        !style?.width && RATIO_CLASS[ratio],
        className,
      )}
    >
      {src && status !== "error" ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            status === "loading" ? "opacity-0" : "opacity-100",
          )}
        />
      ) : null}

      {status === "loading" ? (
        <Skeleton className="absolute inset-0 rounded-lg" />
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <FallbackIcon className="h-6 w-6" aria-hidden="true" />
          {fallbackLabel ? (
            <span className="text-caption">{fallbackLabel}</span>
          ) : null}
          {/* The alt text still has to reach assistive technology even when the
              image itself never arrives. */}
          {alt ? <span className="sr-only">{alt}</span> : null}
        </div>
      ) : null}

      {overlay ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}

/** Small square thumbnail for list rows and evidence grids. */
export function MediaThumb({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <Media
      src={src}
      alt={alt}
      ratio="square"
      className={cn("shrink-0 rounded-md", className)}
      // Inline because the size is a caller-chosen pixel value, not a token.
      style={{ width: size, height: size }}
    />
  );
}
