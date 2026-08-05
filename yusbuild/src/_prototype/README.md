# `_prototype/` — visual reference only

This directory holds the original YusBuild click-through prototype. It is kept
so the intended screens stay viewable while the real implementation is built.

**It is not production code and must not be imported by it.**

- Every screen renders from the hardcoded fixtures in `data.ts`. Nothing here
  calls the API.
- Routes are mounted at `/_prototype/*` and only in development
  (`import.meta.env.DEV`). They are excluded from production builds.
- An ESLint `no-restricted-imports` rule blocks imports from this directory
  outside of it.

## Why it is still here

The prototype is the only record of several intended layouts (the tabbed detail
screen, the BOQ summary, the dashboard chart arrangement). Deleting it before
those screens are rebuilt would lose that reference. The domain teams own the
decision to delete each page once its real equivalent ships.

## What NOT to copy from it

The prototype predates the platform layer and encodes patterns that were
deliberately replaced:

| Prototype pattern | Use instead |
| --- | --- |
| `findProject()` / `findPile()` falling back to record `[0]` | A real not-found state — never silently show the wrong record |
| Hand-built `<Table>` markup | `DataTable` from `@/components/shared` |
| Hand-built stat `<Card>` blocks | `StatCard` |
| `PrototypeState` | `EmptyState` / `ErrorState` |
| Uncontrolled search inputs and non-functional filter buttons | `SearchInput` + `FilterBar` wired to `useDataTableParams` |
| `useState` form fields | react-hook-form + zod |
| `formatM3()` emitting `m3` | `@/lib/format` (emits `m³`) |
| Inline `isViewer` checks | `RoleGate` / `useIsViewer` |
