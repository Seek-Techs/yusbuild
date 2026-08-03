import * as React from "react";

/**
 * Subscribe to a CSS media query.
 *
 * Uses useSyncExternalStore rather than an effect + setState: it is the correct
 * primitive for an external browser API, avoids a render with a stale value,
 * and stays correct under concurrent rendering.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia?.(query);
      if (!media) return () => {};
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = React.useCallback(
    () => window.matchMedia?.(query).matches ?? false,
    [query],
  );

  // Server/prerender default. Matches the mobile-first assumption: false means
  // "not yet known to be desktop".
  const getServerSnapshot = React.useCallback(() => false, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Tailwind breakpoints, mirrored from tailwind.config.js.
 *
 * `lg` is the app shell's mobile↔desktop pivot: at and above it the sidebar is
 * a persistent rail; below it navigation moves into a Sheet drawer. This value
 * must stay in sync with the `lg:` classes in the shell, or both the sidebar
 * and the drawer can render at once (or neither).
 */
export const BREAKPOINTS = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
} as const;

/** True at `lg` and above, where the persistent sidebar is shown. */
export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.lg);
}
