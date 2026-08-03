import * as React from "react";

/**
 * Theme context. Split from ThemeProvider so that file exports only components
 * (a React Fast Refresh requirement) — the same split used by AuthContext.
 */

export type Theme = "light" | "dark" | "system";

/** The theme actually applied to the document, with "system" resolved. */
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** The user's preference, which may be "system". */
  theme: Theme;
  /** What is actually on screen right now. Use this for anything that needs a
   *  concrete colour scheme, e.g. the Toaster or chart colours. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Cycles light → dark → light, resolving "system" to its current value. */
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

export const THEME_STORAGE_KEY = "yusbuild-theme";
