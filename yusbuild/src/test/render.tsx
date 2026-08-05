import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

/**
 * The shared test renderer.
 *
 * Every component test should go through this rather than RTL's bare `render`,
 * so provider setup stays consistent across teams. Import it as:
 *
 *   import { renderWithProviders, screen } from "@/test/render";
 *
 * It re-exports everything from @testing-library/react, so it can be a drop-in
 * replacement for that import.
 */

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  "wrapper"
> {
  /** Initial URL. Use this to exercise route params and query-string state. */
  route?: string;
  /** Full history stack, when a test needs to assert back/forward behaviour. */
  routerEntries?: string[];
  /** Supply your own client to pre-seed the cache or assert on it. */
  queryClient?: QueryClient;
  /**
   * Observe URL writes made through nuqs. Assert on
   * `onUrlUpdate.mock.calls[0][0].queryString` — the testing adapter owns the
   * query string, so `location.search` from react-router will not reflect it.
   */
  onUrlUpdate?: (event: { queryString: string }) => void;
  /**
   * Set false when the tree under test supplies its own router — e.g. a
   * `RouterProvider` built with `createMemoryRouter`, which is required to test
   * anything using `useMatches` (breadcrumbs, route handles). Nesting two
   * routers throws.
   */
  withRouter?: boolean;
}

/**
 * A QueryClient tuned for tests: retries off (so an expected failure fails
 * immediately instead of after backoff) and no caching between tests.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
  user: ReturnType<typeof userEvent.setup>;
}

export function renderWithProviders(
  ui: React.ReactNode,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const {
    route = "/",
    routerEntries,
    queryClient = createTestQueryClient(),
    withRouter = true,
    onUrlUpdate,
    ...renderOptions
  } = options;

  const user = userEvent.setup();
  const entries = routerEntries ?? [route];

  // nuqs ships a dedicated testing adapter that replaces the framework one and
  // owns the query string itself, so URL state works without a real router.
  // `searchParams` seeds it from the same `route` the MemoryRouter uses.
  const initialSearch = entries[0]?.includes("?")
    ? `?${entries[0].split("?")[1]}`
    : "";

  function Wrapper({ children }: { children: React.ReactNode }) {
    const withNuqs = (
      <NuqsTestingAdapter
        searchParams={initialSearch}
        onUrlUpdate={onUrlUpdate}
      >
        {children}
      </NuqsTestingAdapter>
    );

    return (
      <QueryClientProvider client={queryClient}>
        {withRouter ? (
          <MemoryRouter initialEntries={entries}>{withNuqs}</MemoryRouter>
        ) : (
          withNuqs
        )}
      </QueryClientProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return { ...result, queryClient, user };
}

export * from "@testing-library/react";
export { userEvent };
