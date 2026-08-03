/**
 * HTTP status extraction.
 *
 * Deliberately kept free of any axios import so it can be used from the
 * QueryClient config without pulling the API client into that module graph.
 * The full error normalizer builds on this.
 */

/** Statuses that will never succeed on retry. */
export const NON_RETRYABLE_STATUSES = new Set([
  400, // validation — the request body is wrong
  401, // handled by the refresh interceptor; retrying fights it
  403, // permission — deterministic
  404, // missing — deterministic
  405,
  409, // workflow conflict — the server state genuinely disallows this
  410,
  422,
]);

interface MaybeAxiosError {
  response?: { status?: unknown };
  status?: unknown;
}

/**
 * Best-effort HTTP status for an unknown thrown value.
 *
 * Reads `error.response.status` (axios) and falls back to `error.status`
 * (fetch Response, and some libraries). Returns undefined for network errors,
 * timeouts, and anything non-HTTP.
 */
export function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const candidate = error as MaybeAxiosError;
  const fromResponse = candidate.response?.status;
  if (typeof fromResponse === "number") return fromResponse;

  const direct = candidate.status;
  if (typeof direct === "number") return direct;

  return undefined;
}

export function isRetryableError(error: unknown): boolean {
  const status = getHttpStatus(error);
  // No status means a network/timeout failure, which is worth retrying.
  if (status === undefined) return true;
  return !NON_RETRYABLE_STATUSES.has(status);
}
