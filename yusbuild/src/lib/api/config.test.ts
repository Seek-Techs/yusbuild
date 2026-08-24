import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl } from "./config";

describe("normalizeApiBaseUrl", () => {
  it("defaults to the proxied local API prefix", () => {
    expect(normalizeApiBaseUrl(undefined)).toBe("/api");
    expect(normalizeApiBaseUrl("")).toBe("/api");
    expect(normalizeApiBaseUrl("   ")).toBe("/api");
  });

  it("preserves the production API origin and prefix", () => {
    expect(
      normalizeApiBaseUrl("https://yusbuild-production.up.railway.app/api"),
    ).toBe("https://yusbuild-production.up.railway.app/api");
  });

  it("removes trailing slashes before endpoint paths are joined", () => {
    expect(normalizeApiBaseUrl("/api/")).toBe("/api");
    expect(
      normalizeApiBaseUrl("https://yusbuild-production.up.railway.app/api/"),
    ).toBe("https://yusbuild-production.up.railway.app/api");
  });

  it("rejects a pasted env assignment as the variable value", () => {
    expect(() =>
      normalizeApiBaseUrl(
        "VITE_API_URL=https://yusbuild-production.up.railway.app/api",
      ),
    ).toThrow("VITE_API_URL must be the URL value only");
  });
});
