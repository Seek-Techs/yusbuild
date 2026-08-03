import type { ListParams } from "@/types/api";

/**
 * Query-key conventions.
 *
 * Keys are NOT centralised here — each feature owns its own keys in
 * `features/<domain>/api/keys.ts`, so domains stay independent. This module
 * provides the shared *shape* so those keys are consistent and invalidation
 * behaves predictably.
 *
 * The shape is hierarchical, from broad to narrow:
 *
 *   [domain]                              → invalidates everything in a domain
 *   [domain, "list"]                      → all lists, any params
 *   [domain, "list", params]              → one specific list
 *   [domain, "detail", id]                → one record
 *   [domain, "detail", id, "boq"]         → a sub-resource of that record
 *
 * Because React Query matches keys by prefix, `invalidateQueries({ queryKey:
 * ["piles"] })` after a mutation clears every pile list and detail in one call.
 *
 * Build a domain's keys with `createEntityKeys`:
 *
 *   export const pileKeys = createEntityKeys("piles");
 *   pileKeys.list({ page: 1, search: "P-01" });
 *   pileKeys.detail(42);
 *   pileKeys.sub(42, "breakdown");
 *
 * IMPORTANT: put the *debounced* search value in the key, never the raw input
 * value, or every keystroke creates a new cache entry and fires a request.
 */

export type QueryKeyRoot = readonly [string];

export interface EntityKeys {
  /** Everything in this domain. Use as the invalidation root after mutations. */
  all: readonly [string];
  /** All lists, regardless of params. */
  lists: readonly [string, "list"];
  /** One list, identified by its params. */
  list: (params?: ListParams) => readonly unknown[];
  /** All details, regardless of id. */
  details: readonly [string, "detail"];
  /** One record. */
  detail: (id: string | number) => readonly unknown[];
  /** A sub-resource of one record, e.g. "boq", "breakdown", "history". */
  sub: (
    id: string | number,
    resource: string,
    params?: ListParams,
  ) => readonly unknown[];
}

export function createEntityKeys(domain: string): EntityKeys {
  const all = [domain] as const;
  const lists = [domain, "list"] as const;
  const details = [domain, "detail"] as const;

  return {
    all,
    lists,
    list: (params) => (params ? [...lists, params] : [...lists]),
    details,
    detail: (id) => [...details, id],
    sub: (id, resource, params) =>
      params ? [...details, id, resource, params] : [...details, id, resource],
  };
}
