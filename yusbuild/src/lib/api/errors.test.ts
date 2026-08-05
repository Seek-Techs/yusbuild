import { describe, expect, it, vi } from "vitest";

import {
  applyFieldErrors,
  normalizeApiError,
  normalizeApiErrorAsync,
  type NormalizedError,
} from "./errors";

/**
 * The backend emits five structurally different error bodies, three of which
 * omit `status_code`. These tests pin each one, because a normalizer that
 * silently mishandles a shape produces a blank error message rather than a
 * crash — nothing fails loudly.
 */

/** An axios-shaped rejection. */
function httpError(status: number, data?: unknown): Error {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data },
  });
}

describe("normalizeApiError", () => {
  describe("backend error shapes", () => {
    it("handles shape A — the global exception handler", () => {
      const result = normalizeApiError(
        httpError(403, {
          error: "PermissionDenied",
          detail: "You do not have permission to perform this action.",
          status_code: 403,
        }),
      );

      expect(result.kind).toBe("forbidden");
      expect(result.status).toBe(403);
      expect(result.code).toBe("PermissionDenied");
      expect(result.message).toBe(
        "You do not have permission to perform this action.",
      );
    });

    it("handles shape B — serializer validation with field errors", () => {
      const result = normalizeApiError(
        httpError(400, {
          error: "ValidationError",
          detail: "Validation failed",
          errors: {
            pile_no: ["Pile 'P-001' already exists in this project."],
            design_length_m: [
              "Ensure this value is greater than or equal to 1.",
            ],
          },
          status_code: 400,
        }),
      );

      expect(result.kind).toBe("validation");
      expect(result.fieldErrors).toEqual({
        pile_no: ["Pile 'P-001' already exists in this project."],
        design_length_m: ["Ensure this value is greater than or equal to 1."],
      });
      // "Validation failed" is a generic wrapper; a real field message is more
      // useful when this has to be shown without a form.
      expect(result.message).toContain("pile_no");
    });

    it("handles shape C — a bare 409 with no error or status_code", () => {
      // The workflow conflicts in execution/certification/verification return
      // this. Deriving `kind` from the body would fail here.
      const result = normalizeApiError(
        httpError(409, { detail: "Record is already submitted." }),
      );

      expect(result.kind).toBe("conflict");
      expect(result.status).toBe(409);
      expect(result.message).toBe("Record is already submitted.");
      expect(result.code).toBeUndefined();
    });

    it("handles shape D — piles recalculate, no status_code", () => {
      const result = normalizeApiError(
        httpError(400, {
          error: "Recalculation failed",
          detail: "No active configuration for pile type TYPE_II.",
        }),
      );

      expect(result.kind).toBe("validation");
      expect(result.code).toBe("Recalculation failed");
      expect(result.message).toBe(
        "No active configuration for pile type TYPE_II.",
      );
    });

    it("handles shape E — a bare DRF field-error map", () => {
      const result = normalizeApiError(
        httpError(400, { project: ["This field is required."] }),
      );

      expect(result.kind).toBe("validation");
      expect(result.fieldErrors).toEqual({
        project: ["This field is required."],
      });
    });
  });

  describe("status to kind mapping", () => {
    it.each([
      [400, "validation"],
      [401, "unauthorized"],
      [403, "forbidden"],
      [404, "notFound"],
      [409, "conflict"],
      [422, "validation"],
      [500, "server"],
      [503, "server"],
    ])("maps %i to %s", (status, kind) => {
      expect(normalizeApiError(httpError(status)).kind).toBe(kind);
    });

    it("treats a missing status as a network failure", () => {
      expect(normalizeApiError(new Error("Network Error")).kind).toBe(
        "network",
      );
    });

    it("ignores a status_code in the body that contradicts the HTTP status", () => {
      // Defensive: the body is not the authority. Shapes C/D/E omit it, and a
      // stale or wrong value must not change how the error is classified.
      const result = normalizeApiError(
        httpError(409, { detail: "Conflict.", status_code: 200 }),
      );
      expect(result.kind).toBe("conflict");
      expect(result.status).toBe(409);
    });
  });

  describe("message is always usable", () => {
    it.each([400, 401, 403, 404, 409, 500])(
      "falls back to a default for a bodyless %i",
      (status) => {
        const result = normalizeApiError(httpError(status));
        expect(result.message).toBeTruthy();
        expect(result.message.length).toBeGreaterThan(10);
      },
    );

    it("never returns an empty message for junk input", () => {
      for (const input of [null, undefined, "", 0, [], {}, new Error("")]) {
        expect(normalizeApiError(input).message).toBeTruthy();
      }
    });

    it("surfaces the transport message for network failures", () => {
      expect(
        normalizeApiError(new Error("timeout of 0ms exceeded")).message,
      ).toBe("timeout of 0ms exceeded");
    });
  });

  it("passes an already-normalized error through unchanged", () => {
    const once = normalizeApiError(httpError(403, { detail: "Nope." }));
    expect(normalizeApiError(once)).toBe(once);
  });
});

describe("normalizeApiErrorAsync", () => {
  it("reads a blob-wrapped error body", async () => {
    // CSV/XLSX exports use responseType: "blob", so even error bodies arrive
    // as a Blob. Without reading it back, the UI shows "[object Blob]".
    const blob = new Blob(
      [
        JSON.stringify({
          error: "NotFound",
          detail: "Project not found.",
          status_code: 404,
        }),
      ],
      { type: "application/json" },
    );

    const result = await normalizeApiErrorAsync(httpError(404, blob));

    expect(result.kind).toBe("notFound");
    expect(result.message).toBe("Project not found.");
  });

  it("degrades gracefully when a blob is not JSON", async () => {
    const blob = new Blob(["pile_no,steel_kg\n"], { type: "text/csv" });
    const result = await normalizeApiErrorAsync(httpError(500, blob));

    expect(result.kind).toBe("server");
    expect(result.message).toBeTruthy();
    expect(result.message).not.toContain("object Blob");
  });
});

describe("applyFieldErrors", () => {
  it("attaches each field error to its input", () => {
    const setError = vi.fn();
    const error: NormalizedError = {
      kind: "validation",
      status: 400,
      message: "Validation failed",
      fieldErrors: {
        pile_no: ["Already exists."],
        diameter_mm: ["Must be at least 200."],
      },
      raw: null,
    };

    applyFieldErrors(error, setError);

    expect(setError).toHaveBeenCalledWith("pile_no", {
      type: "server",
      message: "Already exists.",
    });
    expect(setError).toHaveBeenCalledWith("diameter_mm", {
      type: "server",
      message: "Must be at least 200.",
    });
  });

  it("routes non_field_errors to the form root", () => {
    // DRF puts cross-field errors here. Setting them on a field that does not
    // exist means react-hook-form drops them and the user sees nothing.
    const setError = vi.fn();

    applyFieldErrors(
      {
        kind: "validation",
        status: 400,
        message: "Validation failed",
        fieldErrors: {
          non_field_errors: ["Actual length cannot exceed design length."],
        },
        raw: null,
      },
      setError,
    );

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Actual length cannot exceed design length.",
    });
  });

  it("routes errors for fields the form does not render to the root", () => {
    const setError = vi.fn();

    applyFieldErrors(
      {
        kind: "validation",
        status: 400,
        message: "Validation failed",
        fieldErrors: { created_by: ["Unknown user."] },
        raw: null,
      },
      setError,
      { knownFields: ["pile_no"] },
    );

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Unknown user.",
    });
  });

  it("falls back to a form-level error when there are no field errors", () => {
    const setError = vi.fn();

    applyFieldErrors(
      {
        kind: "conflict",
        status: 409,
        message: "Record is already submitted.",
        raw: null,
      },
      setError,
    );

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Record is already submitted.",
    });
  });
});
