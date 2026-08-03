import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { renderWithProviders, screen } from "./render";
import { server } from "./msw/server";
import { API, errorConflict, paginated } from "./msw/handlers";

/**
 * Harness smoke tests. These assert that the test infrastructure itself works —
 * jsdom stubs, MSW interception, and the provider wrapper — so that a failure
 * in a real test is a failure in the code under test, not the harness.
 */
describe("test harness", () => {
  it("renders through the shared providers", () => {
    renderWithProviders(<p>hello</p>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("stubs the jsdom APIs that the shell and charts depend on", () => {
    expect(window.matchMedia("(min-width: 1024px)").matches).toBe(false);
    expect(typeof globalThis.ResizeObserver).toBe("function");
  });

  it("intercepts requests with MSW using the DRF envelope", async () => {
    server.use(
      http.get(`${API}/v1/projects/`, () =>
        HttpResponse.json(paginated([{ id: 1, name: "Lekki" }], { count: 1 })),
      ),
    );

    const response = await fetch(`${API}/v1/projects/`);
    const body = await response.json();

    expect(body).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, name: "Lekki" }],
    });
  });

  it("can reproduce the backend's bare-detail 409 conflict shape", async () => {
    server.use(
      http.post(`${API}/v1/execution/driving-records/1/submit/`, () =>
        errorConflict("Record is already submitted."),
      ),
    );

    const response = await fetch(
      `${API}/v1/execution/driving-records/1/submit/`,
      {
        method: "POST",
      },
    );

    expect(response.status).toBe(409);
    // Deliberately asserting the absence of `error`/`status_code`: this shape
    // differs from the global handler, and the normalizer must cope.
    expect(await response.json()).toEqual({
      detail: "Record is already submitted.",
    });
  });
});
