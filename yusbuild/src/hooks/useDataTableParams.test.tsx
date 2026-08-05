import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, waitFor } from "@/test/render";
import { useDataTableParams } from "./useDataTableParams";

/**
 * List state lives in the URL so a filtered, sorted, paginated view can be
 * shared, bookmarked and reloaded. These tests pin that guarantee — every
 * failure mode here is silent, producing a link that does not reproduce what
 * the sender was looking at.
 *
 * URL writes are asserted through nuqs' `onUrlUpdate` rather than
 * `location.search`: the testing adapter owns the query string, so react-router
 * never sees these updates.
 */

// Module scope, so the identity is stable across renders — which is how
// callers should declare it too.
const FILTER_KEYS = ["project"] as const;

function Probe({
  filterKeys = FILTER_KEYS,
}: {
  filterKeys?: readonly string[];
}) {
  const params = useDataTableParams({ filterKeys, debounceMs: 20 });

  return (
    <div>
      <span data-testid="page">{params.page}</span>
      <span data-testid="search">{params.search}</span>
      <span data-testid="ordering">{params.ordering ?? "-"}</span>
      <span data-testid="filters">{JSON.stringify(params.filters)}</span>
      <span data-testid="queryParams">
        {JSON.stringify(params.queryParams)}
      </span>
      <span data-testid="activeCount">{params.activeFilterCount}</span>

      <button onClick={() => params.setPage(3)}>page 3</button>
      <button onClick={() => params.setSearch("P-01")}>search</button>
      <button onClick={() => params.setOrdering("-steel_kg")}>sort desc</button>
      <button onClick={() => params.setFilter("project", "4")}>filter</button>
      <button onClick={() => params.clearFilters()}>clear</button>
    </div>
  );
}

/** The query string after the most recent URL write. */
function latestQueryString(onUrlUpdate: ReturnType<typeof vi.fn>): string {
  const calls = onUrlUpdate.mock.calls;
  return calls.length
    ? (calls[calls.length - 1]![0] as { queryString: string }).queryString
    : "";
}

describe("useDataTableParams", () => {
  it("reads state from the URL", () => {
    renderWithProviders(<Probe />, {
      route: "/piles?page=3&search=P-01&ordering=-steel_kg&project=4",
    });

    expect(screen.getByTestId("page")).toHaveTextContent("3");
    expect(screen.getByTestId("search")).toHaveTextContent("P-01");
    expect(screen.getByTestId("ordering")).toHaveTextContent("-steel_kg");
    expect(screen.getByTestId("filters")).toHaveTextContent('{"project":"4"}');
  });

  it("builds queryParams matching the DRF contract", () => {
    renderWithProviders(<Probe />, {
      route: "/piles?page=2&search=P-01&ordering=pile_no&project=4",
    });

    // Handed straight to the API function and the query key — no translation.
    expect(JSON.parse(screen.getByTestId("queryParams").textContent!)).toEqual({
      page: 2,
      search: "P-01",
      ordering: "pile_no",
      project: "4",
    });
  });

  it("writes page changes to the URL", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<Probe />, {
      route: "/piles",
      onUrlUpdate,
    });

    await user.click(screen.getByText("page 3"));

    expect(screen.getByTestId("page")).toHaveTextContent("3");
    await waitFor(() =>
      expect(latestQueryString(onUrlUpdate)).toContain("page=3"),
    );
  });

  it("updates search state instantly", async () => {
    // The state is never debounced — only the URL write is. This keeps typing
    // responsive, and is why a reset can no longer be undone by a
    // late-landing keystroke.
    const { user } = renderWithProviders(<Probe />, { route: "/piles" });

    await user.click(screen.getByText("search"));

    expect(screen.getByTestId("search")).toHaveTextContent("P-01");
  });

  it("debounces the URL write for search", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<Probe />, {
      route: "/piles",
      onUrlUpdate,
    });

    await user.click(screen.getByText("search"));

    await waitFor(() =>
      expect(latestQueryString(onUrlUpdate)).toContain("search=P-01"),
    );
  });

  it("resets to page 1 when the sort changes", async () => {
    // The classic bug: without this the user is stranded on page 7 of a
    // two-page result, staring at an empty table.
    const { user } = renderWithProviders(<Probe />, { route: "/piles?page=7" });
    expect(screen.getByTestId("page")).toHaveTextContent("7");

    await user.click(screen.getByText("sort desc"));

    await waitFor(() =>
      expect(screen.getByTestId("page")).toHaveTextContent("1"),
    );
  });

  it("resets to page 1 when a filter changes", async () => {
    const { user } = renderWithProviders(<Probe />, { route: "/piles?page=7" });

    await user.click(screen.getByText("filter"));

    await waitFor(() =>
      expect(screen.getByTestId("page")).toHaveTextContent("1"),
    );
    expect(screen.getByTestId("filters")).toHaveTextContent('{"project":"4"}');
  });

  it("resets to page 1 when the search changes", async () => {
    const { user } = renderWithProviders(<Probe />, { route: "/piles?page=7" });

    await user.click(screen.getByText("search"));

    await waitFor(() =>
      expect(screen.getByTestId("page")).toHaveTextContent("1"),
    );
  });

  it("clears search and filters together", async () => {
    const { user } = renderWithProviders(<Probe />, {
      route: "/piles?search=P-01&project=4",
    });

    await user.click(screen.getByText("clear"));

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(""),
    );
    expect(screen.getByTestId("filters")).toHaveTextContent("{}");
    expect(screen.getByTestId("activeCount")).toHaveTextContent("0");
  });

  it("does not restore a cleared search from a pending keystroke", async () => {
    // Regression guard for the hand-rolled version this replaced: it debounced
    // the state itself, so a settled-but-unwritten keystroke could land after
    // the clear and silently bring the search back.
    const { user } = renderWithProviders(<Probe />, { route: "/piles" });

    await user.click(screen.getByText("search"));
    await user.click(screen.getByText("clear"));

    expect(screen.getByTestId("search")).toHaveTextContent("");

    // Well past the debounce window: the cleared value must stay cleared.
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });

  it("ignores query params outside the declared filter keys", () => {
    // An unknown param must not be forwarded to the API.
    renderWithProviders(<Probe />, {
      route: "/piles?project=4&injected=evil",
    });

    expect(screen.getByTestId("filters")).toHaveTextContent('{"project":"4"}');
    expect(screen.getByTestId("queryParams")).not.toHaveTextContent("injected");
  });

  it("counts active filters for the clear affordance", () => {
    renderWithProviders(<Probe />, {
      route: "/piles?search=P-01&project=4",
    });

    expect(screen.getByTestId("activeCount")).toHaveTextContent("2");
  });
});
