import * as React from "react";

import { ThemeContext, type ThemeContextValue } from "@/providers/ThemeContext";

/**
 * Access the current colour scheme.
 *
 * Prefer `resolvedTheme` over `theme` for anything that needs a concrete
 * scheme — `theme` can be "system", which is a preference, not a value.
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
