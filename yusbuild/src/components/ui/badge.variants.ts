import { cva } from "class-variance-authority";

/**
 * Split out of badge.tsx so that file only exports components, which is what
 * React Fast Refresh requires.
 *
 * The `success` / `warning` / `info` / `brand` variants are YusBuild additions
 * on top of stock shadcn. They read from the semantic tokens in index.css and
 * back the shared StatusBadge component — see DESIGN_TOKENS.md.
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        brand:
          "border-transparent bg-brand text-brand-foreground shadow hover:bg-brand/80",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground shadow hover:bg-info/80",
        // Soft/tinted variants — lower emphasis, for dense tables where a row
        // of saturated pills is visually overwhelming.
        "brand-soft":
          "border-transparent bg-brand-muted text-brand-muted-foreground",
        "success-soft":
          "border-transparent bg-success-muted text-success-muted-foreground",
        "warning-soft":
          "border-transparent bg-warning-muted text-warning-muted-foreground",
        "info-soft":
          "border-transparent bg-info-muted text-info-muted-foreground",
        "destructive-soft":
          "border-transparent bg-destructive-muted text-destructive-muted-foreground",
        "neutral-soft": "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
