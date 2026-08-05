import { http, HttpResponse } from "msw";

/**
 * MSW handlers modelling the real YusBuild backend.
 *
 * This module is a handoff deliverable: domain teams should import the error
 * factories rather than hand-rolling response bodies, because the backend's
 * error shapes are genuinely inconsistent (see below) and tests that assume a
 * single shape give false confidence.
 */

export const API = "/api";

// --- Pagination -----------------------------------------------------------

/** DRF PageNumberPagination envelope. PAGE_SIZE is fixed at 50 server-side. */
export function paginated<T>(
  results: T[],
  { count, next = null, previous = null }: Partial<PaginatedInit> = {},
) {
  return {
    count: count ?? results.length,
    next,
    previous,
    results,
  };
}

interface PaginatedInit {
  count: number;
  next: string | null;
  previous: string | null;
}

// --- Error shape factories ------------------------------------------------
// The backend emits four structurally different error bodies. Each factory
// below reproduces one of them exactly.

/** Shape A — the global exception handler (401/403/404/405/throttled). */
export function errorGlobal(status: number, code: string, detail: string) {
  return HttpResponse.json(
    { error: code, detail, status_code: status },
    { status },
  );
}

/** Shape B — DRF serializer validation, field-keyed. */
export function errorValidation(errors: Record<string, string[]>) {
  return HttpResponse.json(
    {
      error: "ValidationError",
      detail: "Validation failed",
      errors,
      status_code: 400,
    },
    { status: 400 },
  );
}

/**
 * Shape C — hand-rolled workflow conflicts in execution/certification/
 * verification/approvals. Note: no `error`, no `status_code`.
 */
export function errorConflict(detail: string) {
  return HttpResponse.json({ detail }, { status: 409 });
}

/** Shape D — piles recalculate/breakdown failures. No `status_code`. */
export function errorAction(code: string, detail: string, status = 400) {
  return HttpResponse.json({ error: code, detail }, { status });
}

/** Shape E — bare DRF default, e.g. from an unwrapped path. */
export function errorBareDetail(detail: string, status = 400) {
  return HttpResponse.json({ detail }, { status });
}

/**
 * An error returned from a blob endpoint (CSV/XLSX export). The body is JSON
 * but arrives as a Blob because the request set responseType: "blob" — the
 * normalizer has to read it back to text before it can be parsed.
 */
export function errorAsBlob(body: unknown, status = 400) {
  return new HttpResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- Default handlers -----------------------------------------------------

export const handlers = [
  http.post(`${API}/auth/token/`, async ({ request }) => {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!body.username || !body.password) {
      return errorValidation({
        username: body.username ? [] : ["This field is required."],
        password: body.password ? [] : ["This field is required."],
      });
    }

    if (body.password === "wrong") {
      return errorGlobal(
        401,
        "AuthenticationFailed",
        "No active account found with the given credentials",
      );
    }

    return HttpResponse.json({
      access: TEST_ACCESS_TOKEN,
      refresh: TEST_REFRESH_TOKEN,
    });
  }),

  http.post(`${API}/auth/token/refresh/`, async ({ request }) => {
    const body = (await request.json()) as { refresh?: string };

    if (!body.refresh || body.refresh === "expired") {
      return errorGlobal(401, "TokenError", "Token is invalid or expired");
    }

    return HttpResponse.json({ access: TEST_ACCESS_TOKEN });
  }),

  http.get(`${API}/v1/projects/`, () => HttpResponse.json(paginated([]))),
  http.get(`${API}/v1/piles/`, () => HttpResponse.json(paginated([]))),
];

// --- Test tokens ----------------------------------------------------------
// A structurally valid unsigned JWT carrying the only claim the real backend
// actually issues: user_id. Deliberately minimal — see the /me gap in
// FRONTEND_PLATFORM.md.

function encodeSegment(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function makeTestJwt(
  payload: Record<string, unknown> = {},
  { expiresInSeconds = 300 } = {},
): string {
  const header = encodeSegment({ alg: "HS256", typ: "JWT" });
  const body = encodeSegment({
    token_type: "access",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    iat: Math.floor(Date.now() / 1000),
    jti: "test-jti",
    user_id: 1,
    ...payload,
  });
  return `${header}.${body}.test-signature`;
}

export const TEST_ACCESS_TOKEN = makeTestJwt();
export const TEST_REFRESH_TOKEN = makeTestJwt(
  { token_type: "refresh" },
  { expiresInSeconds: 86_400 },
);
