import { describe, expect, it } from "vitest";

import { apiClient } from "./client";

describe("apiClient", () => {
  it("joins the default API base URL and login path", () => {
    expect(apiClient.getUri({ url: "auth/token/" })).toBe("/api/auth/token/");
  });
});
