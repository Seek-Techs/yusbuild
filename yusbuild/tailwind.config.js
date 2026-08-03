import tailwindcssAnimate from "tailwindcss-animate";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Tailwind configuration.
 *
 * Every colour below resolves to a CSS variable defined in src/index.css, so
 * light/dark switching is handled entirely by the `.dark` class. Components
 * should always reference these semantic names (`bg-brand`, `text-success`)
 * rather than Tailwind's built-in palette (`bg-teal-600`), which is not
 * theme-aware.
 *
 * Breakpoints are Tailwind defaults and are the documented design-system
 * contract: sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536.
 * `lg` is load-bearing — it is the app shell's mobile↔desktop pivot.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  /*
   * `dark` is applied to <html> imperatively by ThemeProvider and by the
   * anti-FOUC script in index.html, so it never appears in a scanned source
   * file. Without this safelist Tailwind purges the entire `.dark { … }` token
   * block and dark mode silently resolves to light colours.
   */
  safelist: ["dark"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "Inter", ...defaultTheme.fontFamily.sans],
        mono: [...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Named scale. Distinct from Tailwind's text-sm/text-2xl so existing
        // utilities keep working; use these for new work.
        display: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "600" }],
        h1: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        h2: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        h3: ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.25rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }],
        overline: [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "600" },
        ],
        // Stat-tile values. Tabular figures so columns of numbers align.
        metric: [
          "1.875rem",
          {
            lineHeight: "2.25rem",
            fontWeight: "600",
            fontVariantNumeric: "tabular-nums",
          },
        ],
        "metric-sm": [
          "1.25rem",
          {
            lineHeight: "1.75rem",
            fontWeight: "600",
            fontVariantNumeric: "tabular-nums",
          },
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // Neutral hover/focus surface consumed by shadcn primitives.
        // For brand surfaces use `brand`, not this.
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
          muted: "hsl(var(--brand-muted))",
          "muted-foreground": "hsl(var(--brand-muted-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          muted: "hsl(var(--success-muted))",
          "muted-foreground": "hsl(var(--success-muted-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          muted: "hsl(var(--warning-muted))",
          "muted-foreground": "hsl(var(--warning-muted-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          muted: "hsl(var(--info-muted))",
          "muted-foreground": "hsl(var(--info-muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          muted: "hsl(var(--destructive-muted))",
          "muted-foreground": "hsl(var(--destructive-muted-foreground))",
        },
        // The app header. Its own token so it stays navy in both schemes —
        // reusing `primary` would invert it to near-white in dark mode.
        topbar: {
          DEFAULT: "hsl(var(--topbar))",
          foreground: "hsl(var(--topbar-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        elevated: "0 4px 12px -2px rgb(0 0 0 / 0.08)",
        overlay: "0 16px 40px -8px rgb(0 0 0 / 0.18)",
      },
      spacing: {
        // App shell dimensions, referenced by AppShell/Sidebar/Topbar so the
        // sticky offsets and rail widths cannot drift apart.
        topbar: "4rem",
        sidebar: "18rem",
        "sidebar-collapsed": "4rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
