# FRONTEND_ROADMAP.md

This roadmap is reverse-engineered from repository evidence only (backend workflows/APIs/docs and the existing React frontend structure under `yusbuild/src`). No additional features are invented.

---

## Legend

### Verified Repository Facts
Directly supported by repository files (backend endpoints/schema, docs, existing frontend components).

### Inferred Structure
Strongly implied by backend domain split, workflows, and/or existing frontend scaffold.

### Recommendations
Non-breaking guidance derived from verified patterns.

---

## F0 Foundation

### Goal
Establish frontend scaffolding that matches the backend’s domain pipeline (projects → piles → execution → evidence → verification → approvals → certification → audit) and provides a consistent place to plug in API calls, auth, and form actions.

### Verified Repository Facts
- Backend is a JWT-authenticated DRF API with domain routers under `/api/v1/<domain>/`.
- Frontend exists (Vite + React) with shared UI primitives under `yusbuild/src/components/ui/`.

### Inferred Structure
- Introduce a consistent feature folder layout aligned to backend apps: `projects`, `piles`, `execution`, `evidence`, `verification`, `approvals`, `certification`, `audit`.

### Features
- Create an app shell concept (layout/nav/consistent page wrappers) even if content is stubbed.
- Define API client base utilities (URL, headers handling, error normalization) used by all domain modules.

### Dependencies
- Backend base URL and auth scheme (JWT bearer).

### Major pages
- App Shell (layout) with placeholder routes for each domain.

### Major components
- Shared layout components (header/sidebar/content container) built using existing UI primitives.
- Shared error/empty/loading components.

### API domains involved
- All domains indirectly (no domain calls required yet).

### Team ownership
- Frontend Platform (UI shell + API base utilities).

### Testing expectations
- Component/unit tests for layout wrappers and API error normalization (where applicable).

### Definition of Done
- Contributors can run the frontend and navigate to placeholder pages without runtime crashes.
- Shared API utility layer compiles and is imported by domain modules.

---

## F1 Authentication & App Shell

### Goal
Implement the authentication flow required to call protected backend endpoints and ensure users see role-appropriate UI affordances.

### Verified Repository Facts
- Backend provides JWT endpoints:
  - `POST /api/auth/token/`
  - `POST /api/auth/token/refresh/`
- Default authorization depends on group roles `admin`, `engineer`, `viewer`.

### Inferred Structure
- Add a global auth state (token storage + auth status) and apply it to all API calls.
- Gate workflow actions for `viewer` (safe methods allowed; writes denied), consistent with backend permission model.

### Features
- Login screen calling token obtain endpoint.
- Token refresh behavior (for long-lived sessions).
- App shell integrates authenticated user state and conditionally enables actions.

### Dependencies
- Backend JWT implementation.

### Major pages
- Login / Sign-in
- App Shell (authenticated landing + domain navigation)

### Major components
- Auth provider/state container
- Protected route wrapper (prevents calling protected domains without auth)
- Role-based action wrapper components (hide/disable write actions)

### API domains involved
- Auth endpoints (`/api/auth/token/`, `/api/auth/token/refresh/`).

### Team ownership
- Frontend Platform + UX.

### Testing expectations
- Unit tests for auth API wrappers.
- UI tests for gating write actions when user is `viewer` (mock role).

### Definition of Done
- Users can sign in, refresh session, and access protected pages.
- Write workflow buttons are disabled/hidden for unauthorized roles.

---

## F2 Projects

### Goal
Provide project management and project-level reporting (BOQ generation/export) for project members.

### Verified Repository Facts
- Projects endpoints exist under `/api/v1/projects/` with CRUD.
- Project BOQ endpoints exist:
  - `GET /api/v1/projects/{id}/boq/`
  - `GET /api/v1/projects/{id}/boq-csv/`
- Backend uses selectors + project membership scoping for list visibility.

### Inferred Structure
- Projects UI includes project list/search, project detail, and BOQ export actions.

### Features
- Project list page (with search + pagination behavior aligned to DRF paginated responses).
- Project detail page.
- BOQ generation view (render BOQ payload) + CSV export.
- Project create/update forms.

### Dependencies
- Auth (F1).
- Shared API client + error handling (F0).

### Major pages
- `/projects` (list)
- `/projects/:id` (detail)
- `/projects/:id/boq` (BOQ payload)
- `/projects/:id/boq/export-csv` (CSV download UX)

### Major components
- ProjectTable (list)
- ProjectForm
- BOQSummary components
- CSVExport component (handles download response)

### API domains involved
- `projects` (CRUD + BOQ).
- `piles` indirectly for BOQ data composition, but via project BOQ endpoints only.

### Team ownership
- Feature team: Projects.

### Testing expectations
- API wrapper tests for CRUD and BOQ endpoints.
- Component tests for forms (validation) and BOQ rendering.

### Definition of Done
- A project member can create/edit a project and export BOQ.
- Viewer can only view safe endpoints; write actions respect backend permission outcomes.

---

## F3 Piles

### Goal
Provide pile management, calculation breakdown, and pile-level history/auditing UI.

### Verified Repository Facts
- Pile CRUD and actions under `/api/v1/piles/`:
  - `POST /api/v1/piles/`
  - `GET/PUT/PATCH/DELETE /api/v1/piles/{id}/`
  - `POST /api/v1/piles/{id}/recalculate/`
  - `GET /api/v1/piles/{id}/breakdown/`
  - `GET /api/v1/piles/{id}/calculation-history/`
- Bulk and import actions:
  - `POST /api/v1/piles/bulk-create/`
  - `POST /api/v1/piles/import-csv/` (supports dry-run)
- Pile BOQ exports:
  - `GET /api/v1/piles/boq-export-csv/`
  - `GET /api/v1/piles/boq-export-xlsx/`

### Inferred Structure
- Piles UI follows list → detail → actions workflow.
- Provide structured display for calculation breakdown and immutable history.

### Features
- Pile list page with filters matching supported query params (e.g., `project`, `pile_type`, `diameter_mm`, `search`).
- Pile detail page showing:
  - current pile attributes
  - calculation result summary
- Breakdown page rendering breakdown payload.
- Calculation history page (immutable timeline list).
- Write workflows:
  - create/edit pile
  - recalculate
  - bulk create
  - import CSV (upload + dry-run preview + error display)
- Export:
  - BOQ export CSV/XLSX (pile-level)

### Dependencies
- Auth (F1)
- Projects (F2) since piles belong to projects
- Shared forms + table components (F0)

### Major pages
- `/piles`
- `/piles/:id`
- `/piles/:id/breakdown`
- `/piles/:id/calculation-history`
- `/piles/import-csv` (upload)
- `/piles/bulk-create`
- `/piles/export/boq` (format selection)

### Major components
- PileForm
- PileTypeSelector (enum-like)
- BreakdownViewer
- CalculationHistoryTable
- BulkCreateUploader
- CsvImportDryRunResults
- ExportButton

### API domains involved
- `piles` (CRUD + breakdown + history + recalculation + bulk + CSV import + BOQ export)

### Team ownership
- Feature team: Piles.

### Testing expectations
- API wrapper tests for all pile endpoints used.
- Form validation tests aligned with backend constraints (required fields, enum values).
- UI tests for import CSV: row-level errors + dry-run flow.

### Definition of Done
- Users can manage piles and view breakdown/history.
- CSV import shows dry-run results and errors without persisting when dry-run is enabled.

---

## F4 Execution

### Goal
Enable execution record driving workflow UI (create draft, submit, revise).

### Verified Repository Facts
- Execution endpoints under `/api/v1/execution/driving-records/`:
  - `POST /api/v1/execution/driving-records/` (create)
  - `POST /api/v1/execution/driving-records/{id}/submit/`
  - `POST /api/v1/execution/driving-records/{id}/revise/`
  - `GET/PUT/PATCH/DELETE /api/v1/execution/driving-records/{id}/`
- Execution record versioning semantics are immutable; invalid transitions return 409.

### Inferred Structure
- Execution UI must present record current state and available actions based on that state.

### Features
- Execution list page (filter by `execution_record__current_state`, `project`, `pile`, `search`).
- Execution detail page.
- Submit and revise workflow dialogs/forms.
- Display immutability errors (HTTP 409) and surface human-readable messages.

### Dependencies
- Auth (F1)
- Piles UI (F3) because driving records reference project/pile selection

### Major pages
- `/execution`
- `/execution/:id`

### Major components
- ExecutionTable
- ExecutionForm (driving record inputs)
- SubmitDialog
- ReviseDialog

### API domains involved
- `execution`

### Team ownership
- Feature team: Execution.

### Testing expectations
- API wrapper tests for submit/revise endpoints.
- UI tests to ensure correct action availability by state.

### Definition of Done
- Users can create draft driving records, submit them, and revise returned records.

---

## F5 Evidence

### Goal
Enable evidence upload and verification/linking to execution record versions.

### Verified Repository Facts
- Evidence endpoints:
  - `POST /api/v1/evidence/upload/` (multipart)
  - `POST /api/v1/evidence/{id}/verify/`
  - `POST /api/v1/evidence/{id}/link/`
  - `GET /api/v1/evidence/`
  - `GET /api/v1/evidence/{id}/`

### Inferred Structure
- Evidence UI includes file upload UX and metadata inputs.
- Evidence verification UI includes a status transition control.
- Evidence link UI requires choosing an `ExecutionRecordVersion` (provided by backend request fields).

### Features
- Evidence list page with filters (e.g., `project`, `evidence_type`, `verification_status`).
- Evidence upload page (multipart) with metadata fields.
- Evidence detail page showing file metadata and verification status.
- Actions:
  - Verify evidence (status transition UI)
  - Link evidence to an execution record version

### Dependencies
- Auth (F1)
- Execution UI (F4) to obtain or navigate to execution record versions for linking

### Major pages
- `/evidence`
- `/evidence/upload`
- `/evidence/:id`

### Major components
- EvidenceUploadForm
- EvidenceTypeSelector
- EvidenceVerifyAction
- EvidenceLinkAction

### API domains involved
- `evidence`
- `execution` indirectly (for execution record version selection)

### Team ownership
- Feature team: Evidence.

### Testing expectations
- Upload flow tests (mock multipart requests).
- API wrapper tests for upload/verify/link.
- UI tests ensuring verify/link actions handle 409 gracefully.

### Definition of Done
- Evidence can be uploaded, verified, and linked to immutable execution record versions.

---

## F6 Verification

### Goal
Enable running deterministic verification checks and resolving variance flags.

### Verified Repository Facts
- Verification endpoints:
  - `POST /api/v1/verification/run-checks/{execution_record_version_id}/`
  - `GET /api/v1/verification/flags/` (+ filters)
  - `GET /api/v1/verification/flags/{id}/`
  - `POST /api/v1/verification/flags/{id}/acknowledge/`
  - `POST /api/v1/verification/flags/{id}/resolve/`
  - `POST /api/v1/verification/flags/{id}/waive/`

### Inferred Structure
- Verification UI is read-mostly until user resolves flags.

### Features
- Verification run page for a selected execution record version.
- Variance flags list with filters (category, severity, status, project, pile).
- Variance flag detail page showing expected/reported/verified values.
- Action UI for transitions with optional comments.
- Display action log history from the flag payload.

### Dependencies
- Auth (F1)
- Execution and Evidence (F4/F5) because verification runs against execution record versions

### Major pages
- `/verification/run/:executionRecordVersionId`
- `/verification/flags`
- `/verification/flags/:id`

### Major components
- RunChecksButton/Panel
- VarianceFlagTable
- VarianceFlagDetail
- FlagTransitionForm (with comment field)

### API domains involved
- `verification`

### Team ownership
- Feature team: Verification.

### Testing expectations
- API wrapper tests for run-checks and flag transitions.
- UI tests for transition dialogs ensuring 409 errors surface correctly.

### Definition of Done
- Users can run checks, see created/reused flags, and resolve/waive/acknowledge as permitted.

---

## F7 Approval

### Goal
Enable consultant approval workflow on execution record versions.

### Verified Repository Facts
- Approval endpoints:
  - `POST /api/v1/approvals/approve/`
  - `POST /api/v1/approvals/reject/`
  - `POST /api/v1/approvals/return-for-correction/`
  - `POST /api/v1/approvals/comments/`

### Inferred Structure
- Approval UI should handle comment input and render existing immutable decision context if returned by APIs.

### Features
- Approval action panel for a selected execution record version.
- Approve/Reject/Return-for-correction buttons.
- Consultant comments entry UI.
- Consistent mapping of conflict/invalid transitions (409).

### Dependencies
- Auth (F1)
- Execution and Verification (F4/F6) since approvals follow verification states

### Major pages
- `/approvals` (maybe filtered by selected execution record)
- `/approvals/:executionRecordVersionId`

### Major components
- ApprovalDecisionForm
- ApprovalCommentForm
- DecisionActionButtons

### API domains involved
- `approvals`
- Indirectly `execution` (execution_record_version selection)

### Team ownership
- Feature team: Approvals.

### Testing expectations
- API wrapper tests for each decision endpoint.
- UI tests for comment fields and action submission.

### Definition of Done
- Authorized users can approve/reject/return and submit comments without breaking immutable snapshot invariants.

---

## F8 Certification

### Goal
Enable certification package lifecycle actions and line creation.

### Verified Repository Facts
- Certification endpoints:
  - `GET/POST /api/v1/certification/packages/` (list/create)
  - `GET/PUT/PATCH/DELETE /api/v1/certification/packages/{id}/`
  - `POST /api/v1/certification/packages/{id}/add-line/`
  - `POST /api/v1/certification/packages/{id}/submit/`
  - `POST /api/v1/certification/packages/{id}/approve/`
  - `POST /api/v1/certification/packages/{id}/certify/`
  - `POST /api/v1/certification/packages/{id}/lock/`

### Inferred Structure
- UI should treat certification package state as driving which actions are enabled.

### Features
- Package list page with filter `current_state`.
- Package detail page including lines display.
- Create/update draft package form.
- Add line action requiring `source_execution_version` and `pile`.
- Lifecycle actions: submit, approve, certify, lock.

### Dependencies
- Auth (F1)
- Projects/Piles (F2/F3) since packages reference project and lines reference piles
- Approvals (F7) since certification actions likely depend on prior approval workflow

### Major pages
- `/certification/packages`
- `/certification/packages/:id`
- `/certification/packages/:id/lines/add`

### Major components
- CertificationPackageForm
- CertificationPackageLinesTable
- PackageLifecycleActionPanel

### API domains involved
- `certification`

### Team ownership
- Feature team: Certification.

### Testing expectations
- API wrapper tests for lifecycle actions and add-line.
- UI tests ensuring actions are enabled/disabled per package `current_state`.

### Definition of Done
- Users can manage certification packages through lifecycle actions and create lines.

---

## F9 Audit & Reporting

### Goal
Provide audit timeline views for projects and piles.

### Verified Repository Facts
- Audit timeline endpoints:
  - `GET /api/v1/audit/timeline/` (filter: `event_type`, `pile`, `project`)
  - `GET /api/v1/audit/timeline/{id}/`
  - `GET /api/v1/audit/timeline/pile/{pile_id}/`
  - `GET /api/v1/audit/timeline/project/{project_id}/`

### Inferred Structure
- UI offers timeline filters and supports drill-down by project or pile.

### Features
- Timeline list page with filters.
- Timeline detail page.
- Timeline scoping pages for project/pile.

### Dependencies
- Auth (F1)

### Major pages
- `/audit/timeline`
- `/audit/timeline/project/:projectId`
- `/audit/timeline/pile/:pileId`

### Major components
- TimelineTable
- TimelineEventDetail

### API domains involved
- `audit`

### Team ownership
- Feature team: Audit/Reporting.

### Testing expectations
- API wrapper tests for timeline endpoints.
- UI tests for filter application and detail rendering.

### Definition of Done
- Users can browse timeline events scoped by project/pile and view event metadata.

---

## F10 Dashboard & Analytics

### Goal
Provide a read-only dashboard that summarizes backend workflow data.

### Verified Repository Facts
- Backend provides list endpoints across domains (projects, piles, evidence, flags, packages) and timeline queries.

### Inferred Structure
- Dashboard aggregates read-only data; it must reuse existing list endpoints rather than invent new metrics.

### Features
- Summary widgets:
  - counts by project/pile
  - pending/rejected/verified evidence counts
  - open variance flags counts
  - certification packages by state
  - recent timeline events

### Dependencies
- F2–F9 read features implemented (so the dashboard can reuse domain list/read endpoints).

### Major pages
- `/dashboard`

### Major components
- WidgetCard components (reuse UI primitives)
- Lightweight chart/table components backed by list endpoints

### API domains involved
- `projects`, `piles`, `evidence`, `verification`, `certification`, `audit`

### Team ownership
- Frontend UX + Feature integrators.

### Testing expectations
- Snapshot tests for dashboard widgets (rendering given mocked API data).

### Definition of Done
- Dashboard loads without write operations; it only issues GET requests and respects permission-based visibility.

---

## Overall Phasing Notes (contributors)
- Always align UI action availability with backend permission model (write vs read; group roles; object-level membership).
- Prefer domain modules that mirror backend apps.
- Reuse shared UI primitives; introduce new shared components only when they are clearly generic across multiple domains (e.g., pagination tables, confirm dialogs, error banners).

