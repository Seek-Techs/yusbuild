# FRONTEND_ARCHITECTURE.md

This document defines the frontend architecture for YusBuild (React + TypeScript) and acts as the UI-facing equivalent of `ARCHITECTURE.md`.

It is written to preserve **domain boundaries**, align UI workflows with the backend workflow pipeline, and prevent contributors from introducing “frontend business logic” or cross-domain coupling.

---

## Purpose

YusBuild’s backend models and workflows are organized by domain (projects → piles → execution → evidence → verification → approvals → certification → audit) and protected by JWT + role-based permissions.

The frontend architecture exists to:

1. **Mirror backend domain workflows** so UI actions correspond 1:1 with backend endpoints and state transitions.
2. **Enforce trust boundaries** in the UI:
   - UI should not attempt to replicate backend workflow rules beyond what is necessary for role-aware UI affordances.
   - The backend remains the source of truth for validation, authorization, and state transitions.
3. **Prevent cross-domain leakage** by making each domain feature module own its pages, UI components, hooks, and request code.

### Relationship to backend domains and workflows
- **Verified**: Backend authorization uses JWT and group roles (`admin`, `engineer`, `viewer`) and also scopes reads using domain selectors (e.g., visible querysets based on project membership).
- **Verified**: Backend workflows include immutable/versioned patterns (e.g., execution record versions, pile calculation history, audit timeline) and workflow actions (execution submit/revise, verification run/flag transitions, approvals decisions, certification lifecycle actions).
- **Inferred**: The UI should represent these as state-driven interfaces (tables + actions + dialogs) where action availability is determined by the backend-provided state and by role-aware affordances.

---

## Architectural Principles

### Domain-oriented design
- **Verified Repository Facts**
  - Backend is split into DRF domain apps: `projects`, `piles`, `execution`, `evidence`, `verification`, `approvals`, `certification`, `audit`.
  - Each domain has distinct endpoints and (for reads) selectors that scope visibility by user/project membership.
  - Roles are enforced via `IsAdminEngineerOrReadOnly` (safe methods vs write methods).
- **Inferred Practices**
  - Frontend feature modules should be aligned with backend domain apps so contributors can reason about where an endpoint call, form, or UI element belongs.
- **Recommendations**
  - When adding a new UI capability, start by identifying the backend domain app responsible for the underlying data/workflow.
  - If it spans multiple backend domains (e.g., verification flags often depend on execution record versions), keep the UI composition in a single primary domain module and import only the minimum shared components needed from other domains.

### Feature-based organization
- **Verified Repository Facts**
  - `FRONTEND_ROADMAP.md` explicitly proposes domain-aligned features (projects → piles → execution → evidence → verification → approvals → certification → audit).
- **Inferred Practices**
  - Each domain module should be able to evolve independently.
- **Recommendations**
  - Prefer adding code under `features/<domain>/...` rather than adding one-off components to global folders.

### Thin pages (UI orchestration)
- **Verified Repository Facts**
  - Backend follows a separation of concerns: views orchestrate, services implement business logic, selectors scope reads.
  - Frontend dependencies include React Router, React Hook Form, TanStack Query, Axios, and Zod—suggesting a layered frontend approach.
- **Inferred Practices**
  - Pages should primarily: read route params, call domain hooks, render components, and wire up forms.
- **Recommendations**
  - Avoid implementing workflow transitions, calculation/derivation logic, or permission rules in page components.
  - Put domain-specific UI state derivation into domain hooks/selectors (frontend-side), and put API orchestration into the API layer + hooks.

### Separation of UI and API concerns
- **Verified Repository Facts**
  - The repository includes a clear backend boundary: views/serializers/services/selectors.
- **Inferred Practices**
  - Frontend should also split “request code” from “UI rendering code”.
- **Recommendations**
  - All Axios calls should go through a centralized API client module and domain API modules.

### Reusable components
- **Verified Repository Facts**
  - Existing shared UI primitives exist under `yusbuild/src/components/ui/` (Radix-based components + React Hook Form helpers).
- **Inferred Practices**
  - Shared primitives (buttons, forms, tables, skeletons, dialogs) should be imported widely.
- **Recommendations**
  - Only create new “shared” components when they are genuinely generic across multiple domains.

### Role-aware UI
- **Verified Repository Facts**
  - Backend permission model: safe methods are allowed for `viewer`/`engineer`/`admin`; write methods require `admin` or `engineer`.
  - Backend also scopes object-level access by project membership.
- **Inferred Practices**
  - UI can hide or disable actions based on role (and optionally on visible backend state), improving UX.
- **Recommendations**
  - Treat role-aware UI as **affordance**, not authorization. Backend remains the source of truth.
  - UI should handle HTTP 403/409/400 results gracefully even if affordances were shown.

### Alignment with backend workflows
- **Verified Repository Facts**
  - Execution record submit/revise create immutable versions and return 409 for invalid transitions.
  - Verification includes deterministic run-checks and variance flag transitions.
  - Approvals and certification use explicit action endpoints and rely on backend state transitions.
  - Audit uses append-only timeline events.
- **Inferred Practices**
  - UI actions should follow workflow steps and surface immutable/history data with read-only components.
- **Recommendations**
  - For workflows with immutable/versioned state, prefer “timeline/history” UI components that assume append-only semantics.

---

## Technology Stack

This stack is based on repository evidence (package dependencies, existing UI primitives) plus non-breaking recommendations.

### TypeScript
- **Verified Repository Facts**
  - `yusbuild` uses TypeScript (via `typescript` and Vite config).
- **Recommendations**
  - Use strict typing for API request/response models and for form schemas.

### React
- **Verified Repository Facts**
  - Existing React app exists under `yusbuild/src`.
- **Recommendations**
  - Keep components focused: UI rendering + minimal local state.

### React Router
- **Verified Repository Facts**
  - `react-router-dom` is installed.
- **Inferred Practices**
  - Routes will be used to represent domain navigation and workflow pages.
- **Recommendations**
  - Use nested routing to preserve a consistent app shell across domains.

### Axios
- **Verified Repository Facts**
  - `axios` is installed.
- **Recommendations**
  - Use Axios through a single client instance (`api/client.ts`) to ensure consistent headers, auth, and error handling.
  - Do not scatter direct Axios calls across components.

### TanStack Query
- **Verified Repository Facts**
  - `@tanstack/react-query` is installed.
- **Inferred Practices**
  - Server state (lists, detail fetches) should use TanStack Query.
- **Recommendations**
  - Use Query keys that reflect domain + identifiers + filters.
  - Prefer `useMutation` for actions; invalidate affected query keys on success.

### React Hook Form
- **Verified Repository Facts**
  - `react-hook-form` is installed.
  - Repository already includes a `components/ui/form.tsx` wrapper that integrates React Hook Form patterns.
- **Recommendations**
  - Encapsulate form wiring in reusable `Form` wrappers and domain form hooks.

### Zod
- **Verified Repository Facts**
  - `zod` is installed (`zod` dependency).
- **Recommendations**
  - Use Zod to define request payload schemas (when appropriate) and to validate/transform form values.

---

## Folder Structure

> The current repo includes a React app under `yusbuild/` and existing shared UI primitives under `yusbuild/src/components/ui/`.

Recommended structure (domain-aligned and contributor-friendly):

```text
yusbuild/src/
  app/
    api/
    auth/
    providers/
    routes/
    layout/
  components/
    ui/            # existing Radix + UI primitives (buttons, form helpers, table, etc.)
    shared/        # generic shared UI not tied to any domain
  features/
    projects/
      api/
      components/
      hooks/
      pages/
      types/
      schemas/
    piles/
      ...
    execution/
      ...
    evidence/
      ...
    verification/
      ...
    approvals/
      ...
    certification/
      ...
    audit/
      ...
  lib/
    utils.ts
    api/
    formatting/
    errors/
  types/
    api.ts
    auth.ts
    pagination.ts
  hooks/
    useAuthRole.ts
    usePagination.ts
    useDebouncedValue.ts
  routes/
    index.tsx
    ProtectedRoute.tsx
    PublicRoute.tsx
  providers/
    QueryProvider.tsx
    ToastProvider.tsx
  utils/
    http.ts
```

### Responsibilities by folder
- **`app/`**
  - App-level composition: layout shell, route config, auth/provider wiring.
- **`components/ui/`**
  - Verified existing shared UI primitives (Radix-based + Tailwind styling) including the React Hook Form UI integration.
- **`components/shared/`**
  - Generic components used across domains (error banners, empty states, pagination controls).
- **`features/<domain>/`**
  - Domain-owned pages, UI components, forms, hooks, and API modules.
  - Keeps domain vocabulary and endpoint coupling localized.
- **`lib/`**
  - Cross-cutting utilities (class name utilities, formatting helpers, error normalization).
- **`types/`**
  - Shared TypeScript types (auth role shape, pagination response shape, shared error type).
- **`routes/`**
  - Route wrappers (public/protected, role-aware navigation helpers).
- **`providers/`**
  - Global providers such as TanStack Query provider and toasts.

---

## Feature Module Structure

For each domain module (projects/piles/execution/evidence/verification/approvals/certification/audit), implement the following structure:

```text
features/<domain> / 
  components/
    <domain-specific UI pieces>
  pages/
    <route pages for this domain>
  hooks/
    <domain hooks that orchestrate UI with API/hooks>
  api/
    index.ts
    client.<ts> (optional)
    requests.ts (optional)
  types/
    <domain models for view-layer use>
  schemas/
    <Zod schemas used for forms or request payload validation>
```

### Domains derived from repository workflows
- **projects**
- **piles**
- **execution**
- **evidence**
- **verification**
- **approvalS**
- **certification**
- **audit**

> Naming note: the backend app is `apps/approvals`, so the frontend should use `features/approvals`.

---

## Routing Architecture

This section is a **recommendation** for how to wire routes as the frontend grows.

### Public routes
- **Verified Repository Facts**
  - Backend exposes JWT token endpoints and schema/docs endpoints.
- **Inferred Practices**
  - Login should be the primary public page.

Recommended public routes:
- `/login` (JWT obtain token flow)

### Protected routes
- **Verified Repository Facts**
  - Default DRF permission denies unauthenticated users for non-safe operations.
- **Recommendations**
  - Protect all domain routes that require JWT.

Recommended protected routes:
- `/projects/*`
- `/piles/*`
- `/execution/*`
- `/evidence/*`
- `/verification/*`
- `/approvals/*`
- `/certification/*`
- `/audit/*`

### Role-aware navigation
- **Verified Repository Facts**
  - Backend write permissions require `admin` or `engineer`.
- **Recommendations**
  - Sidebar/menu should:
    - show domain areas broadly for read-only roles where appropriate
    - show/enable write actions (buttons/dialog options) only for `admin/engineer`
  - Still handle failures returned by the backend.

### Nested route strategy
- **Recommendations**
  - Use a domain route tree under a common app shell.
  - Example (conceptual):
    - `/projects` (list)
    - `/projects/:projectId`
    - `/projects/:projectId/boq`
  - Avoid duplicating shell components in each page.

### Page hierarchy
- **Recommendations**
  - Each domain page should be implemented as a thin orchestrator:
    - route param parsing
    - calling domain hooks
    - rendering domain components

---

## State Management

### Server state
- **Recommendations**
  - Use TanStack Query for all server-driven data:
    - list endpoints (projects/piles/evidence/flags/packages/timeline)
    - detail endpoints
    - workflow actions (submit/revise/verify/link/run-checks/approve/certify/lock)
  - Prefer `invalidateQueries` for affected queries after mutations.
  - For export endpoints (CSV/XLSX), handle downloads via dedicated mutation/query functions (download as file stream or trigger browser download).

### Local UI state
- **Recommendations**
  - Keep UI-only state in components/hooks:
    - dialog open/closed
    - selected row id
    - form step state
  - Keep it minimal and discard on unmount where possible.

### Shared application state
- **Verified Repository Facts**
  - Backend role-based access exists; JWT auth must be represented in frontend.
- **Recommendations**
  - Use a dedicated auth provider/context for:
    - access token storage
    - current user role(s) if available
    - auth status (authenticated/unauthenticated)
  - Avoid using global state as a substitute for TanStack Query.

---

## API Layer

### `api/client.ts`
- **Recommendations**
  - Create a single Axios instance responsible for:
    - base URL configuration
    - attaching JWT access token (Authorization header)
    - request interception (e.g., content-type for JSON vs multipart)
    - request cancellation (optional)
    - consistent error normalization into a shared error shape

### Domain API modules
- **Recommendations**
  - Under `features/<domain>/api/`, create functions for each domain endpoint category:
    - CRUD/read:
      - list, detail, filtered list
    - workflow actions:
      - submit/revise/run-checks/verify/link/approve/certify/lock
    - exports:
      - CSV/XLSX triggers

### Request interception
- **Recommendations**
  - Centralize auth header behavior.
  - Normalize HTTP errors:
    - 400 validation errors
    - 401 unauthorized/auth expired
    - 403 forbidden
    - 409 conflict (invalid workflow transition)

### Authentication handling
- **Recommendations**
  - On 401 due to expired token, trigger token refresh behavior (see Authentication Architecture).

### Error handling
- **Recommendations**
  - Convert API errors into:
    - user-facing messages
    - field-level form errors (when relevant)
  - Ensure TanStack Query can surface errors consistently.

### Pagination support
- **Recommendations**
  - Use shared pagination types that match DRF paginated responses (`count`, `next`, `previous`, `results`).
  - Keep query key + page in sync.

---

## Forms and Validation

### Recommended form patterns
- **Verified Repository Facts**
  - The repo includes `react-hook-form` primitives under `components/ui/form.tsx`.
- **Recommendations**
  - Use React Hook Form as the form state manager.
  - Use a consistent wrapper structure:
    - `Form` provider
    - domain-specific `<FormField>` components
    - submit handler triggers domain API mutation

### React Hook Form responsibilities
- **Recommendations**
  - Own:
    - input registration
    - controlled/uncontrolled field glue
    - form-level validity tracking
    - field-level error display

### Zod validation responsibilities
- **Recommendations**
  - Own:
    - schema validation + transformation of form values
    - deriving request payload shape
  - Do not duplicate backend validation logic—Zod can validate formats and basic constraints to improve UX.

---

## Authentication Architecture

### JWT flow and token refresh behavior
- **Verified Repository Facts**
  - Backend JWT endpoints:
    - `POST /api/auth/token/`
    - `POST /api/auth/token/refresh/`
  - Backend uses `JWTAuthentication` for API.
  - Schema security indicates JWT bearer.
- **Recommendations**
  - Frontend should implement:
    - login page posts credentials to token obtain endpoint
    - store access + refresh tokens in a safe manner (implementation detail left to contributors)
    - refresh on expiration via refresh endpoint

> This document does not prescribe storage strategy (e.g., localStorage vs memory) because the repo evidence here only confirms endpoints.

### Protected routes
- **Recommendations**
  - Use a `ProtectedRoute` wrapper that:
    - ensures authenticated session
    - otherwise redirects to `/login`

### Role-aware menus
- **Verified Repository Facts**
  - Groups: `admin`, `engineer`, `viewer` and safe vs write behavior.
- **Recommendations**
  - UI menu should:
    - allow read navigation (safe pages)
    - conditionally show write actions
  - Still rely on backend responses for final authorization.

---

## Layout Architecture

### App shell
- **Recommendations**
  - Create an app shell used by all protected routes:
    - sidebar navigation
    - main content container
    - consistent loading/error boundaries

### Sidebar / Topbar / Breadcrumbs
- **Recommendations**
  - Sidebar:
    - domain-level navigation
  - Topbar:
    - user identity and global actions (e.g., sign out)
  - Breadcrumbs:
    - reflect route hierarchy (especially for nested `:id` routes)

### Responsive layout strategy
- **Recommendations**
  - Use responsive CSS patterns already established in the project’s UI approach (Tailwind + existing styles).
  - Ensure the app shell does not break tables/forms on smaller screens.

---

## Shared Component Strategy

### When components belong in `components/`
- **Recommendations**
  - Place components that are generic and domain-agnostic:
    - form primitives (e.g., `FormField`, `FormControl` wrappers already exist)
    - empty states, error banners
    - generic data display components (table, pagination, skeletons)

### When components belong in `features/<domain>/components/`
- **Recommendations**
  - Place components that encode domain vocabulary or endpoint-specific UI:
    - pile breakdown viewers
    - verification flag transition dialogs
    - certification package lifecycle panels

---

## Performance Principles

All items below are **recommendations**.

- **Code splitting / Lazy loading**
  - Lazy-load domain route bundles.
- **Caching**
  - Rely on TanStack Query caching for server state.
- **Pagination**
  - Use paginated table components for endpoints that support `page` and `count`.
- **Avoiding duplicate API requests**
  - Prefer TanStack Query over manual request deduplication.
  - Centralize request calls in domain hooks.
- **Optimistic updates**
  - Only if backend semantics make it safe; otherwise prefer invalidation + refetch.
  - For workflow actions that can return 409 conflict, optimistic updates should be conservative.

---

## Testing Architecture

This section is **recommendations** based on repository testing expectations and standard React testing practice.

### Vitest
- **Recommendations**
  - Use Vitest for unit and integration tests.

### React Testing Library
- **Recommendations**
  - Use React Testing Library for component/page UI tests.

### Mock Service Worker (MSW)
- **Recommendations**
  - Use MSW to mock API requests and simulate:
    - success responses
    - 400 validation errors
    - 401/403 permission failures
    - 409 workflow conflicts

### Test types
- **Component tests**
  - Render shared primitives (forms, buttons, tables).
  - Ensure action dialogs call mutations properly.
- **Page tests**
  - Assert route param parsing + data fetching.
  - Assert loading/error/empty states.
- **Integration tests**
  - Simulate workflows end-to-end at the frontend layer:
    - e.g., run verification → transition flag

### Definition of Done for frontend features
- **Recommendations**
  - Contributor can run frontend dev server without runtime errors.
  - Feature includes:
    - domain module API + hooks
    - thin pages
    - tests covering at least:
      - success state
      - a failure state (400/409/403/401 as applicable)
  - No cross-domain imports of endpoint-specific code.

---

## Anti-Patterns

Avoid these practices.

- **Fat pages**
  - Pages should not contain complex business logic or workflow orchestration.
- **Business logic inside components**
  - Avoid embedding workflow derivations, state transitions, or validation rules in components.
- **Duplicated API calls**
  - Do not copy request logic into multiple components.
  - Centralize request code in domain API modules + hooks.
- **Cross-domain leakage**
  - Do not let `features/<domainA>` directly call domainA+domainB endpoints unless explicitly composed in a shared orchestration layer.
- **Global state abuse**
  - Do not store server data in global state; use TanStack Query.
- **Direct fetch/axios calls scattered across components**
  - All requests must go through the API layer.

---

## Future Evolution

The frontend will evolve while preserving backend alignment.

### How to extend the architecture safely
- Keep the domain module boundary intact:
  - new endpoints → new functions inside the responsible `features/<domain>/api/`
  - new UI screens → `features/<domain>/pages/`
  - shared UI primitives → `components/ui/` or `components/shared/`
- Prefer additive changes:
  - introduce new hooks and components without breaking existing route contracts.

### Preserving domain boundaries while enabling cross-domain workflows
- **Recommendations**
  - Use compositional containers (domain pages or domain hooks) to coordinate cross-domain workflows.
  - When workflow data must come from multiple domains, fetch it within the domain’s hook layer and pass it down as props.
  - Avoid creating “god modules” that import every domain.

---

## Verified Repository Facts vs Inferred Practices vs Recommendations

This file intentionally uses three labels throughout:

- **Verified Repository Facts**
  - Statements directly supported by repository evidence (backend docs/config, schema security, existing React dependencies and existing UI primitives).
- **Inferred Practices**
  - Strongly implied frontend patterns derived from backend layering, workflow behavior, and existing dependency stack.
- **Recommendations**
  - Non-breaking guidance for contributors on how to implement and evolve frontend code while staying aligned with the backend.

