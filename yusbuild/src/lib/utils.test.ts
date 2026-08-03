import { describe, expect, it } from "vitest";

import { cn } from "./utils";

/**
 * `cn` has to know about this project's custom scales.
 *
 * tailwind-merge infers conflict groups from stock Tailwind, so a custom font
 * size (`text-caption`) and a custom colour (`text-brand`) both read as
 * `text-*` and it drops one. The failure is silent — the element simply renders
 * at the wrong size — which is why these are pinned.
 */
describe("cn", () => {
  it("keeps a custom font size alongside a custom colour", () => {
    // Regression guard: this dropped `text-caption`, so an active nav item
    // rendered at the browser default 16px while its siblings were 12px.
    const result = cn("text-caption", "text-brand-muted-foreground");

    expect(result).toContain("text-caption");
    expect(result).toContain("text-brand-muted-foreground");
  });

  it.each([
    "text-display",
    "text-h1",
    "text-h2",
    "text-h3",
    "text-body",
    "text-caption",
    "text-overline",
    "text-metric",
    "text-metric-sm",
  ])("keeps %s when a colour is applied", (size) => {
    expect(cn(size, "text-success")).toContain(size);
  });

  it.each([
    "text-brand",
    "text-success",
    "text-warning",
    "text-info",
    "text-topbar-foreground",
    "text-chart-1",
  ])("keeps %s when a font size is applied", (colour) => {
    expect(cn("text-body", colour)).toContain(colour);
  });

  it("still resolves genuine conflicts", () => {
    // Two font sizes, or two colours, must collapse to the last one — that is
    // the whole point of the merge.
    expect(cn("text-body", "text-h1")).toBe("text-h1");
    expect(cn("text-brand", "text-success")).toBe("text-success");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges stock Tailwind sizes against custom colours", () => {
    expect(cn("text-sm", "text-brand")).toContain("text-sm");
    expect(cn("text-sm", "text-brand")).toContain("text-brand");
  });
});
