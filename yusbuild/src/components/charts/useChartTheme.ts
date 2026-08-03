import * as React from "react";

import { useTheme } from "@/hooks/useTheme";

/**
 * Resolved chart colours for the current colour scheme.
 *
 * Recharts needs concrete colour strings — it cannot consume `hsl(var(--x))`
 * from a CSS custom property. The obvious workaround is a module-level
 * constant:
 *
 *   const STEEL = "hsl(var(--chart-1))";   // ✗ evaluated once, at import
 *
 * which silently breaks dark mode: the value is read before any theme is
 * applied and never re-read, so charts keep painting light-mode colours on a
 * dark page. This hook re-resolves whenever the scheme changes.
 *
 * Always source chart colours from here. Never hardcode a hex, and never read
 * a CSS variable at module scope.
 */

export interface ChartTheme {
  /** Five distinct series colours, for lines, bars and pie slices. */
  series: string[];
  axis: string;
  grid: string;
  /** Inline style for a Recharts <Tooltip contentStyle={…}>. */
  tooltip: React.CSSProperties;
  /** Colour for text rendered inside the chart surface. */
  foreground: string;
}

const SERIES_TOKENS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const;

/** Read an HSL triplet from a custom property and wrap it for CSS. */
function resolveToken(styles: CSSStyleDeclaration, token: string): string {
  const value = styles.getPropertyValue(token).trim();
  return value ? `hsl(${value})` : "";
}

function readChartTheme(
  // Not read inside — it exists so the resolved scheme is a visible input to
  // this function and to the memo below. Without it the dependency is invisible
  // to both the linter and the next reader, since the actual source is the
  // `dark` class on <html>.
  _scheme: "light" | "dark",
): ChartTheme {
  // jsdom returns empty strings for custom properties, so tests get a usable
  // fallback rather than a chart drawn in transparent ink.
  const fallback: ChartTheme = {
    series: ["#2563eb", "#0d9488", "#7c3aed", "#ea580c", "#0891b2"],
    axis: "#64748b",
    grid: "#e2e8f0",
    foreground: "#0f172a",
    tooltip: {},
  };

  if (typeof window === "undefined") return fallback;

  const styles = window.getComputedStyle(document.documentElement);
  const series = SERIES_TOKENS.map((token) => resolveToken(styles, token));
  if (series.some((colour) => !colour)) return fallback;

  const border = resolveToken(styles, "--border");
  const card = resolveToken(styles, "--card");
  const foreground = resolveToken(styles, "--card-foreground");

  return {
    series,
    axis: resolveToken(styles, "--muted-foreground"),
    grid: border,
    foreground,
    tooltip: {
      backgroundColor: card,
      borderColor: border,
      borderRadius: "var(--radius)",
      color: foreground,
      fontSize: "0.75rem",
    },
  };
}

export function useChartTheme(): ChartTheme {
  // `resolvedTheme` is the dependency that matters: it changes exactly when the
  // `dark` class is toggled on <html>, which is when the tokens resolve
  // differently.
  const { resolvedTheme } = useTheme();

  return React.useMemo(() => readChartTheme(resolvedTheme), [resolvedTheme]);
}
