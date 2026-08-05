import { describe, expect, it } from "vitest";

import { getHttpStatus, isRetryableError } from "./status";

/**
 * The retry predicate guards a subtle rule: retrying a 401 fights the
 * single-flight refresh in lib/api/client.ts, turning one visible failure into
 * up to three refresh attempts. The other 4xx codes are deterministic answers,
 * so retrying them only adds latency.
 */
describe("getHttpStatus", () => {
  it("reads an axios-shaped error", () => {
    expect(getHttpStatus({ response: { status: 409 } })).toBe(409);
  });

  it("reads a fetch Response-shaped error", () => {
    expect(getHttpStatus({ status: 404 })).toBe(404);
  });

  it("prefers response.status when both are present", () => {
    expect(getHttpStatus({ response: { status: 403 }, status: 500 })).toBe(403);
  });

  it("returns undefined for non-HTTP failures", () => {
    expect(getHttpStatus(new Error("Network Error"))).toBeUndefined();
    expect(getHttpStatus(null)).toBeUndefined();
    expect(getHttpStatus(undefined)).toBeUndefined();
    expect(getHttpStatus("timeout")).toBeUndefined();
    expect(getHttpStatus({ response: {} })).toBeUndefined();
  });
});

describe("isRetryableError", () => {
  it.each([400, 401, 403, 404, 405, 409, 410, 422])(
    "does not retry %i",
    (status) => {
      expect(isRetryableError({ response: { status } })).toBe(false);
    },
  );

  it.each([500, 502, 503, 504])("retries %i", (status) => {
    expect(isRetryableError({ response: { status } })).toBe(true);
  });

  it("retries network and timeout failures, which carry no status", () => {
    expect(isRetryableError(new Error("Network Error"))).toBe(true);
    expect(isRetryableError({ code: "ECONNABORTED" })).toBe(true);
  });
});
