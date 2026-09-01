/**
 * API configuration.
 *
 * Base URL for all backend requests. Defaults to the same-origin `/api` prefix,
 * which the Vite dev server proxies to the Django backend (see vite.config.ts).
 * Override with VITE_API_URL for non-proxied / deployed environments.
 */
const DEFAULT_API_BASE_URL = "/api";

export const normalizeApiBaseUrl = (rawBaseUrl: string | undefined): string => {
  const baseUrl = rawBaseUrl?.trim() || DEFAULT_API_BASE_URL;

  if (baseUrl.startsWith("VITE_API_URL=")) {
    throw new Error(
      'VITE_API_URL must be the URL value only, for example "/api" or "https://example.com/api".',
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
