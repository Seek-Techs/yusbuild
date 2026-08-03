/**
 * Shared API types matching the Django REST Framework backend.
 *
 * Two facts about this backend that every domain team needs to know:
 *
 * 1. Page size is FIXED at 50 server-side. There is no `page_size` query
 *    parameter — no custom pagination class sets `page_size_query_param`. Do
 *    not build a page-size selector; it would not work.
 *
 * 2. Only list endpoints (and calculation-history / audit timeline) return the
 *    paginated envelope. Every `@action` route — boq, breakdown, recalculate,
 *    and all workflow actions — returns a BARE object. Reaching for `.results`
 *    on an action response is a predictable bug.
 */

/** DRF PageNumberPagination envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Server-fixed page size. See note 1 above. */
export const PAGE_SIZE = 50;

/**
 * Query parameters for a list endpoint.
 *
 * `page`, `search` and `ordering` are provided by DRF's global filter backends.
 * The index signature carries per-viewset `filterset_fields` (e.g. `project`,
 * `pile_type`, `diameter_mm` on piles).
 */
export interface ListParams {
  page?: number;
  search?: string;
  /** DRF ordering: a field name, or `-field` for descending. */
  ordering?: string;
  [filter: string]: string | number | boolean | undefined;
}

/** Total pages for a given result count, at the server's fixed page size. */
export function totalPages(
  count: number,
  pageSize: number = PAGE_SIZE,
): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

/**
 * Drop empty values so query strings and query keys stay stable.
 *
 * Without this, `?search=&project=` and `?project=` produce different cache
 * entries for identical requests.
 */
export function compactParams(params: ListParams): ListParams {
  const result: ListParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    result[key] = value;
  }
  return result;
}
