import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Class merger, taught about this project's custom scales.
 *
 * tailwind-merge resolves conflicts by grouping utilities, and it infers those
 * groups from stock Tailwind. Custom values break that inference:
 * `text-caption` (a font size) and `text-brand` (a colour) both look like
 * `text-*`, so it treats them as conflicting and silently drops the earlier
 * one. The symptom is a component losing its font size the moment a colour is
 * applied alongside it — no error, just wrong type.
 *
 * Declaring the custom scales below keeps size and colour in separate groups,
 * so `cn("text-caption", "text-brand")` correctly keeps both.
 *
 * Add to these lists whenever a new custom fontSize or colour is introduced in
 * tailwind.config.js.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body",
            "caption",
            "overline",
            "metric",
            "metric-sm",
          ],
        },
      ],
      "text-color": [
        {
          text: [
            "brand",
            "brand-muted",
            "brand-muted-foreground",
            "success",
            "success-muted",
            "success-muted-foreground",
            "warning",
            "warning-muted",
            "warning-muted-foreground",
            "info",
            "info-muted",
            "info-muted-foreground",
            "destructive-muted",
            "destructive-muted-foreground",
            "topbar",
            "topbar-foreground",
            "chart-1",
            "chart-2",
            "chart-3",
            "chart-4",
            "chart-5",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
