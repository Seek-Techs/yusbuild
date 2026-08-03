# YusBuild Frontend Platform

What the platform layer provides, and how to build a feature on top of it.

If you are about to write a table, a stat tile, a filter bar, an empty state, a
form page or an API error handler — it already exists. Start here.

See also [DESIGN_TOKENS.md](DESIGN_TOKENS.md) for colour, type and spacing.

---

## Start here

```bash
pnpm install
pnpm dev          # needs the Django dev server on :8000 (the Vite proxy targets it)
pnpm verify       # typecheck + lint + format check + tests
```

CI runs the same sequence plus a production build on any change under
`yusbuild/` — see `.github/workflows/frontend.yml`. The build step is not
redundant: it catches the aliases that keep the prototype and the component
gallery out of the shipped bundle.

Then open **`/_dev`** — a gallery reproducing the client's design reference
using only shared components. It is the fastest way to see what is available and
how the pieces compose. Development only; excluded from production builds.

---

## Where things go

```text
src/
  components/
    ui/          shadcn primitives. Hand-written — see "Adding a primitive".
    shared/      The component library. Import from "@/components/shared".
    charts/      Chart wrappers.
  layouts/       App shell: topbar, sidebar, mobile drawer, breadcrumbs.
  lib/
    api/         Client, error normalizer, status helpers.
    format/      Date, number, currency formatting.
    query/       QueryClient config and query-key conventions.
  hooks/         Cross-domain hooks.
  stores/        zustand — device-local UI preferences ONLY.
  features/      ← your code lives here
  dev/           The gallery. Dev only.
  _prototype/    Frozen reference screens. Do not import.
```

A feature owns everything under `features/<domain>/`:

```text
features/piles/
  api/         request functions and query keys
  components/  UI specific to this domain
  hooks/       domain hooks wrapping useQuery/useMutation
  pages/       thin route components
  schemas/     zod schemas for forms
  routes.tsx   exports a RouteObject[]
```

Export a `RouteObject[]` from `features/<domain>/routes.tsx` and add it to
`src/routes/index.tsx`. That file stays a composition point, so route additions
do not become a merge-conflict magnet.

---

## The rules

These come from `FRONTEND_ARCHITECTURE.md` and are enforced by lint where
possible.

1. **Thin pages.** A page reads route params, calls a domain hook, and renders
   components. No business logic, no workflow orchestration.
2. **No `fetch` or `axios` in components.** All requests go through
   `lib/api`. Lint blocks direct axios imports outside that directory.
3. **TanStack Query owns server state.** Never cache server data in zustand.
4. **List state lives in the URL.** Filters, search, sort and page are query
   params via `useDataTableParams` — not component state, not zustand.
5. **No cross-domain imports.** `features/piles` must not import from
   `features/projects`. Lint blocks deep imports across features.
6. **Role UI is affordance, not authorization.** Hiding a button is a courtesy;
   the backend is the authority. Always handle a 403 on the response.

---

## Building a list screen

The most common screen. Everything below is a shared component.

```tsx
import {
  DataTable, FilterBar, FilterSelect, PageHeader, SearchInput,
  StatusBadge, type DataTableColumn,
} from "@/components/shared";
import { useDataTableParams } from "@/hooks/useDataTableParams";
import { useQuery } from "@tanstack/react-query";

// Module scope: an inline array is a new identity every render.
const FILTER_KEYS = ["project", "pile_type"] as const;

const COLUMNS: DataTableColumn<Pile>[] = [
  { id: "pile_no", header: "Pile", cell: (p) => p.pile_no, sortable: true },
  { id: "steel_kg", header: "Steel", cell: (p) => formatKg(p.steel_kg),
    align: "right", sortable: true },
  { id: "status", header: "Status", cell: (p) =>
      <StatusBadge status={p.status} map={PILE_STATUS} />, hideBelow: "sm" },
];

export function PilesPage() {
  const params = useDataTableParams({ filterKeys: FILTER_KEYS });

  const { data, isLoading, error, refetch } = useQuery({
    // The debounced search is already in queryParams — do not add the raw
    // input value, or every keystroke becomes a request.
    queryKey: pileKeys.list(params.queryParams),
    queryFn: () => fetchPiles(params.queryParams),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Piles" description="All pile records." />

      <FilterBar
        search={<SearchInput value={params.search} onChange={params.setSearch} />}
        filters={
          <FilterSelect label="Type" value={params.filters.pile_type ?? null}
            onChange={(v) => params.setFilter("pile_type", v)}
            options={PILE_TYPE_OPTIONS} />
        }
        activeFilterCount={params.activeFilterCount}
        onClearAll={params.clearFilters}
      />

      <DataTable
        columns={COLUMNS}
        rows={data?.results}
        getRowId={(p) => p.id}
        rowHref={(p) => `/piles/${p.id}`}
        caption="Pile records"
        isLoading={isLoading}
        error={error ? normalizeApiError(error) : null}
        onRetry={refetch}
        sorting={{ ordering: params.ordering,
                   onOrderingChange: params.setOrdering }}
        pagination={{ page: params.page, count: data?.count ?? 0,
                      onPageChange: params.setPage }}
      />
    </div>
  );
}
```

`DataTable` handles loading, empty, error and pagination itself. Do not
pre-empt it with your own conditionals — its state precedence is deliberate
(error beats stale rows; a genuine empty result is not "still loading").

---

## Building a form

```tsx
import { FormPageLayout } from "@/components/shared";
import { applyFieldErrors, normalizeApiError } from "@/lib/api/errors";

const form = useForm<PileValues>({ resolver: zodResolver(pileSchema) });

async function onSubmit(values: PileValues) {
  try {
    await createPile(values);
    navigate("/piles");
  } catch (error) {
    // Puts each backend field error on its matching input, and anything
    // unattached (non_field_errors) on the form root.
    applyFieldErrors(normalizeApiError(error), form.setError);
  }
}

<FormPageLayout
  title="New pile"
  onSubmit={form.handleSubmit(onSubmit)}
  isSubmitting={form.formState.isSubmitting}
  isDirty={form.formState.isDirty}
  cancelTo="/piles"
  aside={<InfoTileList>…</InfoTileList>}
>
  {/* Form fields */}
</FormPageLayout>
```

Use `LoginPage` as the working reference for react-hook-form + zod.

---

## Handling errors

The backend returns **five structurally different error bodies**, three of which
omit `status_code`. Do not read `error.response.data` directly — normalize it:

```ts
const normalized = normalizeApiError(error);

normalized.kind        // "validation" | "unauthorized" | "forbidden"
                       // | "notFound" | "conflict" | "server" | "network"
normalized.message     // always populated and safe to show
normalized.fieldErrors // 400 only; feed to applyFieldErrors
```

For CSV/XLSX downloads use `normalizeApiErrorAsync` — those requests set
`responseType: "blob"`, so even error bodies arrive as a Blob and must be read
back before parsing.

| Kind | Handle it by |
| --- | --- |
| `validation` | `applyFieldErrors` onto the form |
| `unauthorized` | Nothing — the client refreshes and redirects automatically |
| `forbidden` | `<ErrorState variant="forbidden" />` |
| `conflict` | `<ErrorState variant="conflict" />`, then refetch |
| `server` / `network` | `<ErrorState onRetry={refetch} />` |

---

## The backend contract

Facts that surprise people:

- **Page size is fixed at 50.** There is no `page_size` query parameter. Do not
  build a page-size selector; it would not work.
- **Only list endpoints are paginated** (`{count, next, previous, results}`).
  Every `@action` route — `boq`, `breakdown`, `recalculate`, and all workflow
  actions — returns a **bare object**. Reaching for `.results` on one is a
  predictable bug.
- **Access tokens expire in 5 minutes.** The client refreshes automatically on
  401, single-flight. Do not add your own retry.
- `GET /api/v1/projects/{id}/boq/` returns **two structurally different
  payloads** depending on whether the project has piles. Handle both.

### Query keys

Each feature owns its keys. Build them with the shared factory so invalidation
behaves predictably:

```ts
// features/piles/api/keys.ts
export const pileKeys = createEntityKeys("piles");

pileKeys.list(params);          // ["piles", "list", params]
pileKeys.detail(42);            // ["piles", "detail", 42]
pileKeys.sub(42, "breakdown");  // ["piles", "detail", 42, "breakdown"]

// Prefix matching means this clears every pile list and detail at once.
queryClient.invalidateQueries({ queryKey: pileKeys.all });
```

---

## State ownership

| State | Owner |
| --- | --- |
| Server data | TanStack Query |
| Filters, search, sort, page | The URL (`useDataTableParams`) |
| Active tab on a detail screen | The URL (`DetailTabs`) |
| Auth session | `AuthProvider` + `lib/auth` |
| Colour scheme | `ThemeProvider` |
| Sidebar collapsed | zustand (`stores/uiStore`) |
| Dialog open, selected row | local `useState` |
| Form values | react-hook-form |

zustand's remit is deliberately narrow: **device-local UI preferences that must
survive reload**. Putting list state there breaks shareable links and the back
button; putting server data there duplicates the query cache and goes stale.

---

## Component reference

Import everything from `@/components/shared`.

### Page structure

| Component | Notes |
| --- | --- |
| `PageHeader` | Title, eyebrow, badge, actions. `backLink` replaces hand-rolled back buttons |
| `FormPageLayout` | Create/edit scaffold with aside and sticky footer |
| `SuccessBanner` | Post-save confirmation. `role="status"`, announces politely |
| `DetailTabs` | Tabbed detail screen; the active tab lives in the URL |

### Data display

| Component | Notes |
| --- | --- |
| `DataTable` | The main one. Server-side sorting only — client sorting would order one page of N and mislead |
| `StatCard` / `StatCardGrid` | `value` is a ReactNode. Decorative tones (blue/green/purple/orange) vs semantic (success/warning/destructive) — see below |
| `StatusBadge` | Needs a domain-owned status map. Unknown values degrade to a humanized label |
| `Pagination` | DRF-aware. Clamps an out-of-range page from a stale link |
| `InfoTile` / `InfoTileList` | Bordered title/description block |
| `DescriptionList` | Label/value pairs for record attributes |
| `Media` / `MediaThumb` | Images with loading and failure states |

**Decorative vs semantic tones.** Reaching for `success` because you want a
green chip tells the reader a number is healthy when nothing was evaluated. Use
`blue`/`green`/`purple`/`orange` to tell tiles apart; use
`success`/`warning`/`destructive` only when the value carries a judgement.

### Filtering

| Component | Notes |
| --- | --- |
| `SearchInput` | Controlled. Pair with `useDataTableParams`, which owns the debounce |
| `FilterBar` / `FilterSelect` | Filter row with clear-all |

### States

| Component | Notes |
| --- | --- |
| `EmptyState` | Nothing to show, with an optional call to action |
| `ErrorState` | Derives its presentation from the error kind. Withholds retry for 403/409, which cannot succeed on retry |
| `PageSkeleton`, `TableSkeleton`, `CardSkeleton` | Suspense fallbacks |
| `ErrorBoundary` | Pair with `QueryErrorResetBoundary` so retry refetches |

### Actions

| Component | Notes |
| --- | --- |
| `ConfirmDialog` | Optional typed-confirmation gate for irreversible actions |
| `RoleGate` | Renders, or disables with an explanatory tooltip. Affordance only |
| `FileDropzone` | CSV import and evidence upload. Keyboard-operable |
| `DatePicker` | Serialise with `toApiDate()` on submit |

### Charts

| Component | Notes |
| --- | --- |
| `ChartCard` | Card frame with loading, empty and a screen-reader summary |
| `useChartTheme()` | **Always source chart colours from here** |

Reading a CSS variable at module scope resolves it once, before any theme is
applied, so charts silently paint light-mode colours on a dark page:

```ts
const STEEL = "hsl(var(--chart-1))";        // ✗ never updates
const chart = useChartTheme();               // ✓ re-resolves per scheme
```

---

## Formatting

Never format inline — a unit or precision change should be one edit.

```ts
formatKg(27823.3)      // "27,823.30 kg"
formatTons(18.2)       // "18.20 t"
formatM3(174.72)       // "174.720 m³"   (note the superscript)
formatMetres(20)       // "20.0 m"
formatMm(500)          // "500 mm"
formatCurrency(21_600_000, { compact: true })  // "₦21.6M"
formatDate("2026-07-30")       // "30 Jul 2026"
formatRelative(timestamp)      // "3 hours ago"
toApiDate(date)                // "2026-07-30", or undefined
```

Every helper returns `—` for null, undefined or unparseable input rather than
`NaN kg` or `Invalid Date`.

The currency locale is pinned to `en-NG`. Left undefined, a browser set to
`en-IN` renders ₦21,600,000 as "NGN 2.2Cr" with lakh grouping and no ₦ symbol.

---

## Testing

```bash
pnpm test           # once
pnpm test:watch
pnpm test:coverage
```

Use the shared renderer rather than RTL's bare `render`:

```tsx
import { renderWithProviders, screen } from "@/test/render";

const { user } = renderWithProviders(<PilesPage />, {
  route: "/piles?page=2&search=P-01",
});
```

| Option | Use |
| --- | --- |
| `route` | Initial URL, for route params and query state |
| `onUrlUpdate` | Assert URL writes. nuqs owns the query string in tests, so `location.search` will not reflect them |
| `queryClient` | Pre-seed the cache |
| `withRouter: false` | When the tree supplies its own `RouterProvider` |

MSW handlers live in `src/test/msw/handlers.ts` and include factories for every
backend error shape — `errorGlobal`, `errorValidation`, `errorConflict`,
`errorAction`, `errorBareDetail`, `errorAsBlob`. Use them rather than
hand-rolling response bodies; the shapes genuinely differ and a test that
assumes one gives false confidence.

Accessibility smoke tests live in `src/test/a11y.test.tsx`. axe catches
unlabelled controls and broken ARIA, but it is a floor — keyboard and
screen-reader passes still matter.

---

## Adding a shadcn primitive

**Do not run `npx shadcn@latest add`.** It now emits new-york style with
`data-slot` attributes and Tailwind v4 syntax. This project is Tailwind v3 with
the legacy style, so generated components will not match the existing 16 and
will not compile.

Hand-write them, matching the house style: `React.forwardRef`, an explicit
`displayName`, `React.ComponentRef<typeof X>` for the ref type, and no
`data-slot`. Copy structure from the shadcn v2 source and adapt.

`cn` is configured with this project's custom scales. If you add a custom
`fontSize` or colour to `tailwind.config.js`, add it to `src/lib/utils.ts` too —
otherwise tailwind-merge treats `text-caption` and `text-brand` as conflicting
and silently drops one, and the component renders at the wrong size with no
error.

---

## Known gaps

**Blocked on the backend:**

1. **No `GET /api/auth/me/`, and no groups claim in the JWT.** The frontend
   cannot discover a user's roles, so `RoleGate` fails closed — write
   affordances are withheld rather than granted on an assumption. Closing this
   turns them on with no frontend change. An endpoint is preferred over a token
   claim: per-project `ProjectMembership` roles cannot fit in a token, and the
   5-minute lifetime makes claim-based roles go stale.

2. **SimpleJWT has no blacklist.** Signing out clears the client but the refresh
   token stays valid until it expires.

3. **Tokens are in `localStorage`**, so they are XSS-readable. Standard for a
   JWT SPA, worth a deliberate decision before production.

**Frontend, not yet done:**

- The prototype under `src/_prototype/` is frozen reference material. Delete
  each screen as its real equivalent ships.
- The logo mark is an approximation of the client's design. Replace the SVG
  paths in `Logo.tsx` if real artwork arrives.
