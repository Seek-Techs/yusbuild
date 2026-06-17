# FRONTEND_CONTRIBUTING.md

This file teaches contributors how to work on the YusBuild frontend.

It is intentionally aligned with the repository’s backend domain structure, workflow semantics, and security model.

Legend:
- **Verified Repository Facts**: directly supported by repository evidence.
- **Inferred Practices**: strongly implied by backend structure, existing docs, and dependency stack.
- **Recommendations**: non-breaking guidance for contributors.

---

## Purpose

Provide a repeatable way to add or modify frontend features so that:
- UI stays **domain-oriented** and avoids cross-domain coupling.
- Pages remain **thin** and do not duplicate backend orchestration/validation.
- API calls are centralized and consistent.
- Role-aware UX matches backend permission behavior.
- Workflow actions (submit/revise/verify/approve/certify/lock, etc.) behave predictably and handle conflict responses.

---

## Frontend Philosophy

### Feature-oriented design
- **Verified Repository Facts**
  - `FRONTEND_ROADMAP.md` proposes domain-aligned features: projects → piles → execution → evidence → verification → approvals → certification → audit.
- **Inferred Practices**
  - Frontend code should follow the same domain boundaries as the backend.
- **Recommendations**
  - Put new UI/features under `features/<domain>/`.
  - Only create shared UI in `components/` when it is truly domain-agnostic.

### Thin pages
- **Inferred Practices**
  - Pages should primarily wire together route params, domain hooks, and UI components.
- **Recommendations**
  - Pages should not contain heavy workflow logic.
  - Pages should not implement business rules already enforced by backend state transitions.

### Separation of concerns
- **Verified Repository Facts**
  - Backend follows clear orchestration/validation/visibility layering (views, services, selectors).
- **Inferred Practices**
  - Frontend should mirror this by separating:
    - UI rendering
    - API request orchestration
    - UI state derivation
- **Recommendations**
  - Keep request code out of components.
  - Keep mutation orchestration out of page components (use domain hooks).

### Reusable components
- **Verified Repository Facts**
  - Existing UI primitives exist under `yusbuild/src/components/ui/`.
- **Recommendations**
  - Reuse existing primitives for UI consistency.
  - Avoid “one-off” shared components that only solve one screen.

### Role-aware UI
- **Verified Repository Facts**
  - Backend roles are derived from groups: `admin`, `engineer`, `viewer`.
  - Safe methods are allowed for `viewer`/`engineer`/`admin`; write methods require `admin`/`engineer`.
- **Inferred Practices**
  - UI can hide/disable actions to improve UX.
- **Recommendations**
  - Treat role-aware UI as an affordance, not authorization.
  - Always handle 403/409/400 responses from the backend even if you hide write controls.

### Alignment with backend workflows
- **Verified Repository Facts**
  - Backend includes explicit workflow endpoints and state transitions (execution submit/revise; verification run/checks; variance flag acknowledge/resolve/waive; approval decisions; certification lifecycle; audit timeline).
- **Recommendations**
  - UI must reflect backend state and call backend workflow endpoints for transitions.
  - For immutable/versioned concepts, prefer read-only displays plus action buttons that trigger workflow endpoints.

---

## Folder Responsibilities

Use the architecture guidance from `FRONTEND_ARCHITECTURE.md`.

### app/
- **Recommendations**
  - App composition (providers, shell layout, route wiring).

### api/
- **Recommendations**
  - Centralized API client + error normalization.
  - Shared request utilities.

### components/
- **Recommendations**
  - Domain-agnostic UI primitives (especially existing Radix/Tailwind components).
  - Generic shared components (tables, empty states, loading/skeletons).

### features/
- **Recommendations**
  - Domain-owned code: components/pages/hooks/api/types/schemas for that domain.

### hooks/
- **Recommendations**
  - Shared hooks only when they are not tied to a single domain.

### layouts/
- **Recommendations**
  - Layout components that structure protected app UI (shell/sidebar/topbar/breadcrumbs).

### providers/
- **Recommendations**
  - TanStack Query provider, toast provider, etc.

### routes/
- **Recommendations**
  - Route wrappers for public/protected and role-aware navigation.

### types/
- **Recommendations**
  - Shared TypeScript types (pagination shape, API error shape, auth types).

### utils/
- **Recommendations**
  - Cross-cutting utilities (formatters, small pure helpers, class name merging).

---

## Feature Module Structure

For each domain module (`projects`, `piles`, `execution`, `evidence`, `verification`, `approvals`, `certification`, `audit`), follow:

- **components/**
  - Domain-specific UI blocks used by this module.
- **pages/**
  - Thin route pages that orchestrate loading, forms, and action panels.
- **hooks/**
  - Domain hooks that call API modules, manage server cache invalidation, and provide view-layer state.
- **api/**
  - Domain API functions that call backend endpoints (no direct requests in components/pages).
- **types/**
  - View-layer domain types (DTOs, table row shapes).
- **schemas/**
  - Zod schemas for request payload validation and/or form value validation.

---

## Naming Conventions

### Pages
- **Recommendations**
  - Use route-driven naming:
    - `ProjectsListPage`
    - `PileDetailPage`
    - `VerificationFlagsPage`
    - `ExecutionRecordSubmitPage` (if you later introduce a distinct page)

### Components
- **Recommendations**
  - Use descriptive UI names:
    - `ProjectTable`
    - `PileForm`
    - `VarianceFlagTable`
    - `ApprovalDecisionForm`

### Hooks
- **Recommendations**
  - Prefix with the domain capability:
    - `useProjectsList`
    - `usePileDetail`
    - `useRunVerificationChecks`

### Types
- **Recommendations**
  - Types should reflect UI usage (e.g., `PileRow`, `VerificationFlagRow`) and not leak HTTP-specific concerns.

### Files
- **Recommendations**
  - Keep file names consistent with exports and reduce indirection.
  - Prefer `index.ts` barrel exports only when it reduces churn.

---

## Adding a New Feature

Recommended workflow (aligned to `FRONTEND_ARCHITECTURE.md`):

1. **Define domain ownership**
   - **Recommendations**: Decide which backend domain app the feature corresponds to.
2. **Create feature module**
   - **Recommendations**: Add `features/<domain>/` with the correct subfolders.
3. **Add API client**
   - **Recommendations**: Create functions under `features/<domain>/api/`.
4. **Add types**
   - **Recommendations**: Add view-layer types under `features/<domain>/types/`.
5. **Add hooks**
   - **Recommendations**: Wrap API calls with TanStack Query hooks.
6. **Add components**
   - **Recommendations**: Build reusable UI blocks for this feature.
7. **Add pages**
   - **Recommendations**: Keep pages thin; render components and wire forms/actions.
8. **Add routes**
   - **Recommendations**: Register routes under the domain’s route tree.
9. **Add tests**
   - **Recommendations**: Cover success + representative error states.
10. **Update documentation**
   - **Recommendations**: Update any domain-specific notes and ensure architecture docs remain consistent.

---

## State Management Rules

### Server state
- **Recommendations**
  - Use TanStack Query for:
    - lists
    - details
    - workflow action results
  - Invalidate affected queries after mutations.

### UI state
- **Recommendations**
  - Keep ephemeral UI state local (dialogs open, selected row ids, step state).

### Shared state
- **Recommendations**
  - Avoid storing server state in global state.
  - Use shared auth state only for authentication/session concerns.

---

## API Rules

### Avoid direct fetch calls
- **Recommendations**
  - No direct `fetch` / scattered Axios usage in components/pages.

### Use centralized API clients
- **Recommendations**
  - Use a shared API client (e.g., `api/client.ts`) and domain API modules.

### Handle errors consistently
- **Recommendations**
  - Normalize API errors into a common UI representation.
  - Map HTTP `400/401/403/409` to:
    - field errors (400)
    - auth recovery flow (401)
    - role/menu affordances + “forbidden” UX (403)
    - workflow conflict UX (409)

---

## Forms

### React Hook Form responsibilities
- **Verified Repository Facts**
  - The repo includes React Hook Form integration utilities under `yusbuild/src/components/ui/form.tsx`.
- **Recommendations**
  - Use React Hook Form for form state, registration, and error display.

### Validation responsibilities
- **Recommendations**
  - Use Zod (via `@hookform/resolvers`) for client-side validation.
  - Backend is still the source of truth for authorization and workflow correctness.
  - Surface backend validation errors into form fields when possible.

---

## Authentication

### Protected routes
- **Verified Repository Facts**
  - Backend uses JWT authentication and rejects unauthorized users.
- **Recommendations**
  - Route protection should be handled via route wrappers (e.g., `ProtectedRoute`).

### Role-aware navigation
- **Verified Repository Facts**
  - Backend group roles drive safe vs write behavior.
- **Recommendations**
  - Build UI navigation and action availability using role awareness.
  - Always keep server error handling as a fallback.

---

## Testing Expectations

### Vitest
- **Recommendations**
  - Use Vitest for unit/integration tests.

### React Testing Library
- **Recommendations**
  - Use React Testing Library for component and page tests.

### Mock Service Worker (MSW)
- **Recommendations**
  - Use MSW to mock API responses:
    - success
    - 400 validation
    - 401/403 permission
    - 409 workflow conflicts

### Definition of Done (frontend)
- **Recommendations**
  - Feature compiles and runs without runtime crashes.
  - Includes domain module code (API + hooks + thin pages).
  - Includes tests that cover:
    - success path
    - at least one relevant error path (based on workflow complexity)
  - No cross-domain leakage via endpoint calls.

---

## Performance Guidelines

- **Recommendations**
  - Avoid duplicate API calls:
    - Prefer TanStack Query.
    - Centralize request execution in hooks.
  - Pagination:
    - Use DRF pagination shape (`count/next/previous/results`) in list pages.
  - Code splitting:
    - Lazy-load domain route bundles when multiple domains are present.
  - Caching:
    - Rely on TanStack Query caching + invalidation.

---

## Common Anti-Patterns

- Fat pages
  - **Recommendations**: keep pages orchestration-only.
- Business logic in components
  - **Recommendations**: avoid workflow/business computation inside render components.
- Cross-domain leakage
  - **Recommendations**: don’t let `features/<domainA>` directly depend on `features/<domainB>` endpoint details unless composing via domain hooks.
- Global state abuse
  - **Recommendations**: don’t store server entities in global state.
- Duplicated API requests
  - **Recommendations**: don’t duplicate request code across tables and pages; use hooks.

---

## Pull Request Expectations

### Contributor checklist
- **Recommendations**
  - Domain is correct (belongs under `features/<domain>/`).
  - Pages are thin and render components + wire actions.
  - API calls are centralized and consistent.
  - Error handling exists for at least the most important HTTP cases.
  - Role-aware UI aligns with backend role model.
  - Tests added/updated.
  - Architecture docs are not contradicted.

---

## References

- `FRONTEND_ARCHITECTURE.md`
- `FRONTEND_ROADMAP.md`
- `ARCHITECTURE.md`
- `AI_ASSISTANT_GUIDE.md`

---

## Verified Repository Facts vs Inferred Practices vs Recommendations

This document distinguishes responsibilities by labeling:
- **Verified Repository Facts**: grounded in backend/frontend repository evidence.
- **Inferred Practices**: implied by the repo’s layering, docs, and dependency stack.
- **Recommendations**: actionable contributor guidance without requiring code changes.

