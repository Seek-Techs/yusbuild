import * as React from "react";

import { cn } from "@/lib/utils";

interface ContentLayoutProps {
  children: React.ReactNode;
  /**
   * Content width. Dense BOQ and pile tables need more room than the default,
   * so routes can widen it rather than fighting the container.
   */
  width?: "default" | "wide" | "full";
  className?: string;
}

const WIDTHS: Record<NonNullable<ContentLayoutProps["width"]>, string> = {
  default: "max-w-7xl",
  wide: "max-w-[100rem]",
  full: "max-w-none",
};

/**
 * The main content region.
 *
 * Note there is deliberately no `overflow-y-auto` here. The document scrolls,
 * not this container — a scroll container at this level breaks the sticky
 * topbar and, because nothing constrains its height, does nothing anyway.
 *
 * `tabIndex={-1}` makes this a programmatic focus target for the skip link and
 * the route announcer while keeping it out of the normal tab order.
 */
export const ContentLayout = React.forwardRef<HTMLElement, ContentLayoutProps>(
  ({ children, width = "default", className }, ref) => (
    <main
      ref={ref}
      id="main-content"
      tabIndex={-1}
      className={cn(
        "flex-1 p-4 focus-visible:outline-none sm:p-6 lg:p-8",
        className,
      )}
    >
      <div className={cn("mx-auto w-full", WIDTHS[width])}>{children}</div>
    </main>
  ),
);
ContentLayout.displayName = "ContentLayout";
