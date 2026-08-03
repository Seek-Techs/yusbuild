import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Design-token invariants.
 *
 * Every failure mode guarded here is silent — the app still builds and renders,
 * it just looks wrong (often only in dark mode, or only on hover). These are
 * cheap assertions against the token source itself.
 *
 * See DESIGN_TOKENS.md for the rationale behind each rule.
 */

const CSS = readFileSync(resolve(__dirname, "../index.css"), "utf8");

/** Extract the `:root { … }` and `.dark { … }` token blocks. */
function block(selector: ":root" | ".dark"): string {
  const escaped = selector.replace(".", "\\.");
  const match = CSS.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n  \\}`));
  if (!match?.[1]) throw new Error(`Could not find ${selector} block`);
  return match[1];
}

function token(selector: ":root" | ".dark", name: string): string {
  const match = block(selector).match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Missing --${name} in ${selector}`);
  return match[1].trim();
}

/** Parse an `H S% L%` triplet into its lightness component. */
function lightness(value: string): number {
  const match = value.match(/([\d.]+)%\s*$/);
  if (!match?.[1]) throw new Error(`Cannot parse lightness from "${value}"`);
  return Number.parseFloat(match[1]);
}

const SEMANTIC_TOKENS = [
  "brand",
  "success",
  "warning",
  "info",
  "destructive",
] as const;

const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

describe("design tokens", () => {
  it("keeps --accent as a neutral surface, not the brand colour", () => {
    // Regression guard. --accent is shadcn's hover/focus surface, consumed by
    // button ghost/outline, dropdown-menu and select. Pointing it at the teal
    // brand made every ghost-button hover and menu-item focus solid teal.
    for (const scheme of [":root", ".dark"] as const) {
      const accent = token(scheme, "accent");
      const brand = token(scheme, "brand");
      expect(accent).not.toBe(brand);

      // A neutral has very low saturation; the brand teal is ~66-76%.
      const saturation = Number.parseFloat(accent.split(/\s+/)[1] ?? "0");
      expect(saturation).toBeLessThan(45);
    }
  });

  it("distinguishes --card from --background in dark mode", () => {
    // Stock shadcn sets these to the same value, which makes every Card an
    // invisible slab separated only by a 1px border.
    expect(token(".dark", "card")).not.toBe(token(".dark", "background"));
    expect(lightness(token(".dark", "card"))).toBeGreaterThan(
      lightness(token(".dark", "background")),
    );
  });

  it("defines every semantic token in both colour schemes", () => {
    for (const name of SEMANTIC_TOKENS) {
      for (const scheme of [":root", ".dark"] as const) {
        expect(() => token(scheme, name)).not.toThrow();
        expect(() => token(scheme, `${name}-foreground`)).not.toThrow();
        expect(() => token(scheme, `${name}-muted`)).not.toThrow();
        expect(() => token(scheme, `${name}-muted-foreground`)).not.toThrow();
      }
    }
  });

  it("inverts the -muted tints for dark mode", () => {
    // The -muted values back low-emphasis badges and stat-card icon chips. In
    // light mode they are pale tints (~95% L); reusing those on a 4.9% L dark
    // background would blow out. Dark mode needs dark fills instead.
    for (const name of SEMANTIC_TOKENS) {
      expect(lightness(token(":root", `${name}-muted`))).toBeGreaterThan(80);
      expect(lightness(token(".dark", `${name}-muted`))).toBeLessThan(30);
    }
  });

  it("provides five distinct chart series per colour scheme", () => {
    for (const scheme of [":root", ".dark"] as const) {
      const values = CHART_TOKENS.map((name) => token(scheme, name));
      expect(values).toHaveLength(5);
      // Distinct hues, so adjacent slices of the BOQ donut are separable.
      expect(new Set(values).size).toBe(5);
    }
  });

  it("safelists the `dark` class so the token block survives purging", () => {
    // ThemeProvider applies `dark` imperatively, so it never appears in a
    // scanned source file. Without the safelist Tailwind purges the whole
    // `.dark { … }` block and dark mode silently renders light colours.
    const config = readFileSync(
      resolve(__dirname, "../../tailwind.config.js"),
      "utf8",
    );
    expect(config).toMatch(/safelist:\s*\[[^\]]*"dark"/);
  });
});
