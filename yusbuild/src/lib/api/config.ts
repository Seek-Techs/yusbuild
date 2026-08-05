/**
 * API configuration.
 *
 * Base URL for all backend requests. Defaults to the same-origin `/api` prefix,
 * which the Vite dev server proxies to the Django backend (see vite.config.ts).
 * Override with VITE_API_URL for non-proxied / deployed environments.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";
