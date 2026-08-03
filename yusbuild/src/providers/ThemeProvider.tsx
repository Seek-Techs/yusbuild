import * as React from "react";

import {
  THEME_STORAGE_KEY,
  ThemeContext,
  type ResolvedTheme,
  type Theme,
  type ThemeContextValue,
} from "./ThemeContext";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Read the stored preference, tolerating unavailable/blocked localStorage. */
function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

/** Subscription source for useSyncExternalStore. */
function subscribeToSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia?.(DARK_QUERY);
  if (!media) return () => {};
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme;
}

/**
 * Applies the theme to <html>.
 *
 * The `dark` class drives the token block in index.css. `color-scheme` is set
 * alongside it so native UI — scrollbars, form controls, the caret — matches;
 * without it a dark page renders light scrollbars.
 */
function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}): React.ReactElement {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return readStoredTheme();
  });

  // The OS preference, tracked only so a "system" theme re-renders when it
  // flips. useSyncExternalStore is the correct primitive for subscribing to a
  // browser API — it avoids the setState-in-effect pattern and stays correct
  // under concurrent rendering.
  const systemPreference = React.useSyncExternalStore(
    subscribeToSystemTheme,
    systemTheme,
    () => "light" as ResolvedTheme,
  );

  // Derived, not stored: the resolved theme is a pure function of the
  // preference and the OS setting.
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemPreference : theme;

  // Keep the DOM in sync. The inline script in index.html already applied the
  // right class for the first paint; this handles every change after that.
  React.useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage: the theme still applies for this
      // session, it just will not be remembered.
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      const next: Theme = resolve(current) === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // See setTheme.
      }
      return next;
    });
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
