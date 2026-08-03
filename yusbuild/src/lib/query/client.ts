import { QueryClient } from "@tanstack/react-query";

import { getHttpStatus, isRetryableError } from "@/lib/api/status";

/**
 * The shared QueryClient.
 *
 * Two defaults here are load-bearing:
 *
 * 1. `retry` never retries a 4xx. Retrying a 401 actively fights the
 *    single-flight refresh in lib/api/client.ts — each user-visible failure
 *    would trigger up to three refresh attempts. Retrying 403/404/409 is pure
 *    added latency: those are deterministic answers, not transient faults.
 *
 * 2. `throwOnError` escalates only 5xx to the nearest ErrorBoundary. Client
 *    errors (400 field errors, 403 forbidden, 409 workflow conflicts) stay
 *    inline so the domain team can render them next to the thing that failed,
 *    rather than blowing away the page.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Project and pile data is not real-time; a minute of staleness is
        // fine and avoids a refetch storm on every navigation.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        // Site engineers alt-tab constantly. Refetching on every focus is
        // more disruptive than mild staleness.
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          isRetryableError(error) && failureCount < 2,
        throwOnError: (error) => {
          const status = getHttpStatus(error);
          return status !== undefined && status >= 500;
        },
      },
      mutations: {
        // Never auto-retry a write. A 409 means the server state genuinely
        // disallows the transition, and retrying a create risks duplicates.
        retry: false,
      },
    },
  });
}

/** The app-wide instance. Tests should build their own via createQueryClient. */
export const queryClient = createQueryClient();
