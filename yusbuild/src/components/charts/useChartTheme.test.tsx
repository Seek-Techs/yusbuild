import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";
import { useChartTheme } from "./useChartTheme";

/**
 * The bug this hook exists to prevent: reading chart colours from CSS
 * variables at module scope resolves them once, before any theme is applied,
 * so charts keep painting light-mode colours on a dark page. Nothing errors —
 * the chart is simply the wrong colour, which is easy to miss in review.
 */

/** Stand in for the token values a real stylesheet would provide. */
function setTokens(scheme: "light" | "dark") {
  const root = document.documentElement;
  const values =
    scheme === "dark"
      ? {
          "--chart-1": "217 91% 62%",
          "--chart-2": "166 66% 48%",
          "--chart-3": "262 83% 68%",
          "--chart-4": "25 95% 58%",
          "--chart-5": "199 89% 55%",
          "--muted-foreground": "215 20% 65%",
          "--border": "217 33% 18%",
          "--card": "222 47% 9%",
          "--card-foreground": "210 40% 98%",
        }
      : {
          "--chart-1": "221 83% 45%",
          "--chart-2": "166 76% 34%",
          "--chart-3": "262 72% 55%",
          "--chart-4": "25 95% 48%",
          "--chart-5": "199 89% 42%",
          "--muted-foreground": "215 16% 47%",
          "--border": "214 32% 91%",
          "--card": "0 0% 100%",
          "--card-foreground": "222 84% 5%",
        };

  for (const [token, value] of Object.entries(values)) {
    root.style.setProperty(token, value);
  }
}

function Probe() {
  const theme = useChartTheme();
  return (
    <div>
      <span data-testid="series">{theme.series.join("|")}</span>
      <span data-testid="count">{theme.series.length}</span>
      <span data-testid="axis">{theme.axis}</span>
    </div>
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.documentElement.classList.remove("dark");
  window.localStorage.clear();
});

describe("useChartTheme", () => {
  it("resolves the five chart series from CSS variables", () => {
    setTokens("light");

    renderWithProviders(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("5");
    // Wrapped for CSS: the tokens are bare HSL triplets.
    expect(screen.getByTestId("series")).toHaveTextContent("hsl(221 83% 45%)");
  });

  it("re-resolves when the colour scheme changes", async () => {
    // The whole point. A module-scope constant would keep the light value here.
    setTokens("light");

    function Harness() {
      return (
        <ThemeProvider>
          <Probe />
          <ThemeSwitcher />
        </ThemeProvider>
      );
    }

    const { user } = renderWithProviders(<Harness />);
    expect(screen.getByTestId("series")).toHaveTextContent("hsl(221 83% 45%)");

    // Swap the tokens as a real stylesheet would when `.dark` is applied.
    await user.click(screen.getByText("dark"));
    setTokens("dark");
    await user.click(screen.getByText("light"));
    await user.click(screen.getByText("dark"));

    expect(screen.getByTestId("series")).toHaveTextContent("hsl(217 91% 62%)");
  });

  it("falls back to usable colours when tokens are unavailable", () => {
    // jsdom resolves custom properties to empty strings unless a real
    // stylesheet is loaded. Charts must still draw in visible ink.
    renderWithProviders(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("5");
    expect(screen.getByTestId("series")).not.toHaveTextContent("hsl()");
    expect(screen.getByTestId("axis")).toBeTruthy();
  });
});

/** Minimal theme controls, kept out of the probe so it stays readable. */
function ThemeSwitcher() {
  const { setTheme } = useTheme();
  return (
    <>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("light")}>light</button>
    </>
  );
}
