# Performance Characteristics — YusBuild (repo-verified)

This document reverse-engineers performance-related behavior strictly from repository-visible code patterns and tests.

---

## Performance Philosophy

### Verified Facts
- Views use selectors and explicit ORM optimization (`select_related`, `prefetch_related`, `distinct`, pagination).
- Bulk and export endpoints use in-memory buffering where appropriate (CSV and XLSX generation).
- Append-only models and immutable versions influence write patterns (more rows created rather than updated).

### Inferred Behavior
- Primary performance strategy is to reduce query counts and limit result sets via scoping + pagination.

---

## Read Patterns

### Verified Facts: Selector-driven scoping
- Domain selectors provide visibility-scoped querysets.
- `get_queryset()` in viewsets delegates to selectors such as:
  - `apps/piles/selectors.py::visible_piles_queryset`
  - `apps/projects/selectors.py::visible_projects_queryset`
  - `apps/evidence/selectors.py::visible_evidence_items_queryset`
  - `apps/audit/selectors.py::visible_timeline_events_queryset`

### Verified Facts: Query optimization knobs
Examples from repository code:
- `select_related(...)` for FK joins
- `prefetch_related(...)` for reverse relations
- `distinct()` to avoid duplicates when joining evidence links

(Concrete examples exist in `apps/projects/views.py`, `apps/piles/views.py`, `apps/execution/views.py`, `apps/evidence/views.py`, and `apps/audit/views.py`.)

### Verified Facts: Aggregation in project lists
- `apps/projects/views.py::get_queryset()` annotates list/retrieve with:
  - `Count('piles', distinct=True)`
  - `Sum('piles__calculation__total_steel_kg')`
  - `Sum('piles__calculation__actual_concrete_m3')`

---

## Write Patterns

### Verified Facts: Transactions
- Bulk operations use database transactions:
  - Piles `bulk-create` uses `transaction.atomic()`.
  - CSV import uses `transaction.atomic()` with conditional rollback.

### Verified Facts: Versioning / append-only writes
- Execution record versions are immutable and created as new rows.
- Audit/timeline models are append-only.
- Pile calculations are updated for current state and history rows are created.

### Verified Facts: Calc persistence
- Pile calculations are persisted via `calculate_and_persist_pile()` and history entries include snapshots.

---

## Bulk Operations

### Verified Facts: Piles bulk-create
- Endpoint: `POST /api/v1/piles/bulk-create/`.
- Accepts a list payload.
- All-or-nothing semantics implemented with transaction rollback when any row fails.

### Verified Facts: CSV import
- Endpoint: `POST /api/v1/piles/import-csv/`.
- Reads uploaded file into memory (`decoded = file.read().decode('utf-8')`).
- Parses CSV rows and validates per-row.
- Supports dry-run mode via `dry_run` query param or request data.
- Transaction rollback when `dry_run` or errors exist.

---

## Pagination

### Verified Facts
- DRF pagination is configured globally:
  - `REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS'] = PageNumberPagination`
  - `REST_FRAMEWORK['PAGE_SIZE'] = 50`
- Endpoints that return lists rely on pagination (e.g., timeline endpoints, history endpoints).

---

## Query Optimization

### Verified Facts
- Common ORM patterns used throughout views:
  - `select_related` and `prefetch_related`
  - `annotate` for list totals
  - `distinct()` for join-heavy querysets

### Verified Facts: Heavy export endpoints
- XLSX export uses `openpyxl` workbook in memory and streams bytes in response.
- CSV export writes directly to HttpResponse.

---

## State Transitions and Performance Impact

### Verified Facts
- Many workflow actions create new immutable records (versions/history/events).
- This means:
  - reads become dependent on filtering/pagination
  - dataset growth impacts timeline/event and history queries.

---

## Audit Growth

### Verified Facts
- Audit/timeline models are append-only and never modified.
- Timeline listing endpoints query these append-only tables.

### Inferred Behavior
- As event volume increases, timeline queries depend heavily on:
  - selector scoping
  - filterset fields (`project`, `pile`, `event_type`)
  - indexes defined in models (where present)

---

## Bottlenecks (repository-visible limitations)

### Verified/Inferred Limitations
- CSV import reads entire file into memory.
- XLSX export builds whole workbook in memory.
- Some list endpoints use aggregation annotations that may be costly on very large datasets.

---

## Scaling Assumptions

### Inferred Behavior
- The system scales through:
  - pagination
  - scoped querysets
  - immutable record approach (trading write simplicity for read growth)

---

## Recommendations

### Recommendations (convention-based, non-breaking)
- Keep new read endpoints selector-scoped and use `select_related`/`prefetch_related` for ORM join reduction.
- For new bulk endpoints, follow existing transaction patterns.
- When adding new timeline/history views, ensure pagination and filtersets exist to keep query sizes bounded.

