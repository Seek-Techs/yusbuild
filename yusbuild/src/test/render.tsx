import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

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
    ...renderOptions
  } = options;

  const user = userEvent.setup();
  const entries = routerEntries ?? [route];

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {withRouter ? (
          <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return { ...result, queryClient, user };
}

export * from "@testing-library/react";
export { userEvent };
