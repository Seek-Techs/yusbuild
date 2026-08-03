# YusBuild Design Tokens

The single source of truth for colour, type and spacing. Tokens are defined as
CSS custom properties in [`src/index.css`](src/index.css) and mapped to Tailwind
utilities in [`tailwind.config.js`](tailwind.config.js).

## The one rule

**Never hardcode a colour.** No hex, no `rgb()`, no Tailwind palette utilities
(`bg-teal-600`, `text-red-500`). Those are not theme-aware and will be wrong in
dark mode.

```tsx
// ✗ wrong — invisible in dark mode, invisible to the design system
<div className="border-gray-200 bg-white text-slate-900" />
<span style={{ color: "#15997d" }} />

// ✓ right
<div className="border-border bg-card text-card-foreground" />
<span className="text-brand" />
```

Colours are stored as bare HSL triplets (`166 76% 34%`, no `hsl()` wrapper) so
Tailwind can apply opacity modifiers: `bg-brand/10`, `border-success/30`.

---

## `--accent` is not the brand colour

This is the most important thing to know about this token set.

In shadcn/ui, `--accent` is the **neutral hover and focus surface**. It is
consumed by `button` (ghost and outline variants), `dropdown-menu`, `select`,
and every shadcn primitive added later:

```
ghost:   "hover:bg-accent hover:text-accent-foreground"
outline: "border border-input bg-background hover:bg-accent …"
```

This project previously repointed `--accent` at the teal brand colour. The
result: every ghost-button hover, every outline-button hover, and every
menu-item focus painted solid saturated teal with white text — including all
nine sidebar nav items, and the "Open" button in every table row.

**Use `--brand` for brand surfaces. Leave `--accent` alone.** A regression test
in [`src/test/design-tokens.test.ts`](src/test/design-tokens.test.ts) enforces
this.

---

## Colour tokens

### Surfaces

| Token | Utility | Use |
| --- | --- | --- |
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Default body text |
| `--card` | `bg-card` | Card and panel surfaces |
| `--popover` | `bg-popover` | Floating surfaces (menus, popovers, tooltips) |
| `--muted` | `bg-muted` | Subdued fills, disabled backgrounds |
| `--muted-foreground` | `text-muted-foreground` | Secondary/label text |
| `--accent` | — | **shadcn internal hover surface. Do not use directly.** |
| `--border` / `--input` | `border-border` | Borders and input outlines |
| `--ring` | `ring-ring` | Focus rings |

In dark mode `--card` is deliberately lifted above `--background`
(9% vs 4.9% lightness). Stock shadcn sets them equal, which makes every card an
invisible slab separated only by a 1px border.

### Brand

| Token | Utility | Use |
| --- | --- | --- |
| `--primary` | `bg-primary` | Primary actions. Deep navy — note the lightness is far below stock shadcn blue |
| `--brand` | `bg-brand` `text-brand` | Brand teal: eyebrows, active nav, brand accents |
| `--brand-muted` | `bg-brand-muted` | Low-emphasis brand tint (active nav background, icon chips) |

### Semantic status

Each has four parts: the solid colour, its foreground, a `-muted` tint, and that
tint's foreground.

| Token | Meaning | Example domain values |
| --- | --- | --- |
| `--success` | Healthy, complete, approved | `ACTIVE`, `APPROVED`, `verified` |
| `--warning` | Needs attention, paused | `ON_HOLD`, `pending`, `Needs review` |
| `--info` | Neutral informational state | `DRAFT`, `SUBMITTED` |
| `--destructive` | Error, rejection, destructive action | `REJECTED`, `critical` |

Solid vs. soft: use solid (`bg-success`) for a single prominent badge; use soft
(`bg-success-muted text-success-muted-foreground`) in dense tables, where a
column of saturated pills is overwhelming. `Badge` exposes both as variants:
`success` and `success-soft`.

The `-muted` tints **invert between schemes** — pale (~95% lightness) in light
mode, dark fills (~15%) in dark mode. Reusing the light values on a dark
background would blow out.

### Charts

`--chart-1` … `--chart-5`, exposed as `chart.1`–`chart.5` (`fill-chart-1`,
`text-chart-3`). Five distinct hues so adjacent donut slices stay separable.

**Read these through `useChartTheme()`, never as module-scope constants.** A
`const COLOR = "hsl(var(--chart-1))"` evaluated at import time will not update
when the colour scheme changes, so charts render light-mode colours in dark
mode.

---

## Typography

Inter is self-hosted via `@fontsource-variable/inter` (imported in
`src/main.tsx`) — no font-CDN dependency, which matters for site use on poor
connectivity. The stack lives in `tailwind.config.js` under
`theme.fontFamily.sans`; `font-sans` is the single source of truth.

| Utility | Size / line-height | Use |
| --- | --- | --- |
| `text-display` | 30 / 36, 600 | Page hero numbers |
| `text-h1` | 24 / 32, 600 | Page title (one per page) |
| `text-h2` | 20 / 28, 600 | Section heading |
| `text-h3` | 16 / 24, 600 | Card heading |
| `text-body` | 14 / 20 | Body copy — the default |
| `text-caption` | 12 / 16 | Helper and caption text |
| `text-overline` | 12 / 16, 600, tracked | Eyebrow labels above titles |
| `text-metric` | 30 / 36, 600, tabular | Stat-tile values |
| `text-metric-sm` | 20 / 28, 600, tabular | Compact stat values |

`text-metric` and `text-metric-sm` set `font-variant-numeric: tabular-nums` so
figures align in columns. Apply `.tabular-figures` to numeric table cells for
the same reason — quantity data that jitters between rows is hard to scan.

---

## Radius, elevation, spacing

`--radius` (0.5rem) drives the scale: `rounded-sm` (−4px), `rounded-md` (−2px),
`rounded-lg` (base), `rounded-xl` (+4px), `rounded-2xl` (+8px).

Shadows: `shadow-card` (resting), `shadow-elevated` (raised), `shadow-overlay`
(modals, popovers).

Shell dimensions are tokens so sticky offsets cannot drift from rail widths:
`h-topbar` / `top-topbar` (4rem), `w-sidebar` (18rem), `w-sidebar-collapsed`
(4rem).

---

## Breakpoints

Tailwind defaults, documented here because the stakeholder docs specify none:

| | Width | Role |
| --- | --- | --- |
| `sm` | 640px | Stacked → row layouts |
| `md` | 768px | Two-column stat grids; tables stop stacking |
| **`lg`** | **1024px** | **The shell's mobile↔desktop pivot** — sidebar rail above, Sheet drawer below |
| `xl` | 1280px | Four-column stat grids |
| `2xl` | 1536px | Wide dashboards |

`lg` is load-bearing: it must match the value used by `useMediaQuery` for the
mobile drawer, or the sidebar and the drawer can both render (or neither).

---

## Dark mode

Class-based (`darkMode: ["class"]`). `ThemeProvider` writes `dark` onto
`<html>`; an inline script in `index.html` applies it before first paint to
avoid a white flash.

Because the class is applied imperatively it never appears in a scanned source
file, so `tailwind.config.js` **safelists `"dark"`**. Without that, Tailwind
purges the entire `.dark { … }` block and dark mode silently renders light
colours — the build succeeds and nothing warns.

---

## Adding a token

1. Add it to **both** `:root` and `.dark` in `src/index.css`. A token defined in
   only one scheme is a dark-mode bug waiting to happen.
2. Map it under `theme.extend.colors` in `tailwind.config.js`.
3. If it is a status colour, add `-muted` / `-muted-foreground` too, and add
   matching `Badge` variants in `src/components/ui/badge.variants.ts`.
4. Document it above.
5. Check it in both schemes. `pnpm test src/test/design-tokens.test.ts` enforces
   the structural rules; contrast is still a human judgement.
