import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { useTheme } from "@/hooks/useTheme";
import { ThemeProvider } from "./ThemeProvider";
import { THEME_STORAGE_KEY } from "./ThemeContext";

/** Point matchMedia at a fixed OS preference for the duration of a test. */
function mockSystemPrefersDark(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: prefersDark && query.includes("dark"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }));
}

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>set dark</button>
      <button onClick={() => setTheme("system")}>set system</button>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

function renderTheme() {
  return renderWithProviders(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    mockSystemPrefersDark(false);
  });

  it("defaults to following the system preference", () => {
    mockSystemPrefersDark(true);
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("applies the dark class and color-scheme to <html>", async () => {
    const { user } = renderTheme();
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(screen.getByText("set dark"));

    expect(document.documentElement).toHaveClass("dark");
    // color-scheme matters: without it a dark page renders light scrollbars
    // and native form controls.
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("persists the preference across mounts", async () => {
    const { user, unmount } = renderTheme();
    await user.click(screen.getByText("set dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    unmount();
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("resolves 'system' to a concrete scheme when toggling", async () => {
    mockSystemPrefersDark(true);
    const { user } = renderTheme();

    // Preference is "system" resolving to dark, so a toggle must land on
    // light — not flip the preference to some other ambiguous value.
    await user.click(screen.getByText("toggle"));

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });

  it("survives unavailable localStorage", async () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });

    const { user } = renderTheme();
    // The theme still applies for this session; it just is not remembered.
    await user.click(screen.getByText("set dark"));
    expect(document.documentElement).toHaveClass("dark");

    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("throws when useTheme is used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderWithProviders(<ThemeProbe />)).toThrow(
      /must be used within a ThemeProvider/,
    );
    spy.mockRestore();
  });
});
