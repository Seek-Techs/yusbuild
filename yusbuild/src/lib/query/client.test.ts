import { describe, expect, it } from "vitest";

import { createQueryClient } from "./client";

/**
 * These assertions read the resolved default options rather than driving real
 * queries, because the rules being protected are configuration decisions whose
 * failure mode is silent: retries that fight the auth refresh, or a 403 that
 * blows away the page instead of rendering inline.
 */
function queryDefaults() {
  return createQueryClient().getDefaultOptions().queries;
}

/**
 * An axios-shaped rejection. React Query types the error as `Error`, but axios
 * actually rejects with an Error carrying a `response` property — which is
 * what the predicates read.
 */
function httpError(status: number): Error {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status },
  });
}

describe("QueryClient defaults", () => {
  it("never retries a client error", () => {
    const retry = queryDefaults()?.retry;
    if (typeof retry !== "function") throw new Error("retry should be a fn");

    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(retry(0, httpError(status))).toBe(false);
    }
  });

  it("retries server errors up to twice", () => {
    const retry = queryDefaults()?.retry;
    if (typeof retry !== "function") throw new Error("retry should be a fn");

    const serverError = httpError(503);
    expect(retry(0, serverError)).toBe(true);
    expect(retry(1, serverError)).toBe(true);
    expect(retry(2, serverError)).toBe(false);
  });

  it("retries network failures, which have no status", () => {
    const retry = queryDefaults()?.retry;
    if (typeof retry !== "function") throw new Error("retry should be a fn");

    expect(retry(0, new Error("Network Error"))).toBe(true);
  });

  it("escalates only 5xx to an error boundary", () => {
    const throwOnError = queryDefaults()?.throwOnError;
    if (typeof throwOnError !== "function") {
      throw new Error("throwOnError should be a fn");
    }

    // Client errors stay inline so the domain team can render field errors,
    // a forbidden state, or a workflow conflict next to the failing control.
    for (const status of [400, 401, 403, 404, 409]) {
      expect(throwOnError(httpError(status), null as never)).toBe(false);
    }

    for (const status of [500, 503]) {
      expect(throwOnError(httpError(status), null as never)).toBe(true);
    }
  });

  it("does not refetch on window focus", () => {
    // Site engineers alt-tab constantly; refetch storms are worse than a
    // minute of staleness on quantity data.
    expect(queryDefaults()?.refetchOnWindowFocus).toBe(false);
  });

  it("never auto-retries mutations", () => {
    // A 409 means the server state genuinely disallows the transition, and
    // retrying a create risks duplicate records.
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(
      false,
    );
  });
});
