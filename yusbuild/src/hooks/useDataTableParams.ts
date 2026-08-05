import * as React from "react";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
  debounce,
  type Options,
} from "nuqs";

import { compactParams, type ListParams } from "@/types/api";

/**
 * List state lives in the URL.
 *
 * Filter, search, sort and pagination are all query parameters, so a list view
 * can be copied into a chat, bookmarked, or reloaded and land on the same rows.
 * This is also why that state deliberately does NOT live in the zustand store —
 * doing so would break shareable links and the back button.
 *
 *   /piles?page=3&search=P-01&ordering=-steel_kg&project=4&pile_type=TYPE_II
 *
 * Built on nuqs rather than hand-rolled. The critical property it provides is
 * that the returned state updates INSTANTLY while only the URL write is
 * debounced. An earlier hand-rolled version debounced the state itself, which
 * meant every reset (clearing a filter, a back navigation) raced the pending
 * write and could silently restore the value the user had just cleared.
 *
 * Parameter names match the DRF contract exactly (`page`, `search`,
 * `ordering`, plus each viewset's filterset fields), so `queryParams` can be
 * handed straight to an API function and into a query key with no translation.
 */

export interface UseDataTableParamsOptions {
  /**
   * Filter keys this screen owns. Anything else in the URL is ignored rather
   * than forwarded to the API.
   *
   * Declare this as a module-level constant, not an inline literal, so the
   * parser map below stays referentially stable.
   */
  filterKeys?: readonly string[];
  /** Applied when the URL carries no `ordering`. */
  defaultOrdering?: string;
  /** How long to wait after typing stops before the URL is updated. */
  debounceMs?: number;
}

export interface DataTableParams {
  page: number;
  /** Instant — bind this to the input. */
  search: string;
  /**
   * Settles once typing pauses. Use this in the query key so a request fires
   * per pause rather than per keystroke.
   */
  debouncedSearch: string;
  ordering: string | null;
  filters: Record<string, string>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string | null) => void;
  setFilter: (key: string, value: string | null) => void;
  clearFilters: () => void;
  /** Ready to pass to an API function and a query key. */
  queryParams: ListParams;
  activeFilterCount: number;
}

/** Every change but paging invalidates the current page. */
const RESET_PAGE: Options = { history: "push" };

export function useDataTableParams(
  options: UseDataTableParamsOptions = {},
): DataTableParams {
  const { filterKeys = [], defaultOrdering, debounceMs = 300 } = options;

  const [page, setPageRaw] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ history: "push" }),
  );

  // `shallow` is irrelevant here (no server components), but the debounce is
  // the point: state is instant, the URL write waits for a pause, and
  // `history: "replace"` keeps a burst of keystrokes out of the back stack.
  const [search, setSearchRaw] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({
      limitUrlUpdates: debounce(debounceMs),
      history: "replace",
    }),
  );

  const [ordering, setOrderingRaw] = useQueryState(
    "ordering",
    parseAsString.withOptions({ history: "push" }),
  );

  // Keyed on contents rather than identity: callers may pass a new array
  // literal each render, which would otherwise rebuild the parser map every
  // time and reset nuqs' internal state.
  const filterKeysKey = filterKeys.join(",");

  // A parser per declared filter key. Anything else in the URL is invisible to
  // this hook and never reaches the API.
  const filterParsers = React.useMemo(
    () =>
      Object.fromEntries(
        (filterKeysKey ? filterKeysKey.split(",") : []).map((key) => [
          key,
          parseAsString,
        ]),
      ) as Record<string, typeof parseAsString>,
    [filterKeysKey],
  );

  const [filterValues, setFilterValues] = useQueryStates(filterParsers, {
    history: "push",
  });

  const filters = React.useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(filterValues)) {
      if (typeof value === "string" && value) result[key] = value;
    }
    return result;
  }, [filterValues]);

  const setPage = React.useCallback(
    (next: number) => {
      void setPageRaw(next <= 1 ? null : next);
    },
    [setPageRaw],
  );

  // Searching, sorting and filtering all invalidate the current page — without
  // the reset the user is stranded on page 7 of a two-page result, staring at
  // an empty table.
  const setSearch = React.useCallback(
    (next: string) => {
      void setSearchRaw(next || null);
      void setPageRaw(null, RESET_PAGE);
    },
    [setSearchRaw, setPageRaw],
  );

  const setOrdering = React.useCallback(
    (next: string | null) => {
      void setOrderingRaw(next);
      void setPageRaw(null, RESET_PAGE);
    },
    [setOrderingRaw, setPageRaw],
  );

  const setFilter = React.useCallback(
    (key: string, value: string | null) => {
      void setFilterValues({ [key]: value });
      void setPageRaw(null, RESET_PAGE);
    },
    [setFilterValues, setPageRaw],
  );

  const clearFilters = React.useCallback(() => {
    // `null` clears each param. Because nuqs keeps the state instant and only
    // debounces the URL write, this cannot be undone by a late-landing
    // keystroke — the failure mode that made the hand-rolled version flaky.
    void setSearchRaw(null, { limitUrlUpdates: undefined });
    void setFilterValues(
      Object.fromEntries(filterKeys.map((key) => [key, null])),
    );
    void setPageRaw(null, RESET_PAGE);
  }, [setSearchRaw, setFilterValues, setPageRaw, filterKeys]);

  const queryParams = React.useMemo<ListParams>(
    () =>
      compactParams({
        page: page > 1 ? page : undefined,
        search: search || undefined,
        ordering: ordering ?? defaultOrdering ?? undefined,
        ...filters,
      }),
    [page, search, ordering, defaultOrdering, filters],
  );

  return {
    page,
    search,
    // nuqs keeps state instant and debounces only the URL, so the value here is
    // already the settled one by the time the URL reflects it.
    debouncedSearch: search,
    ordering: ordering ?? defaultOrdering ?? null,
    filters,
    setPage,
    setSearch,
    setOrdering,
    setFilter,
    clearFilters,
    queryParams,
    activeFilterCount: Object.keys(filters).length + (search ? 1 : 0),
  };
}
