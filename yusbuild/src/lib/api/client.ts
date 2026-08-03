/**
 * API client — axios singleton for the YusBuild backend.
 *
 * - Injects the Bearer access token on every request (except the auth endpoints).
 * - On a 401, performs a single-flight token refresh and retries the original
 *   request. Concurrent 401s share one in-flight refresh promise.
 * - On refresh failure, clears the session and notifies any registered listener
 *   (the AuthProvider) so the app can redirect to /login.
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "./config";
import {
  clearSession,
  getAuthorizationHeader,
  getRefreshTokenForRequest,
  updateSessionAccessToken,
} from "@/lib/auth";

const TOKEN_PATH = "auth/token/";
const REFRESH_PATH = "auth/token/refresh/";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Requests to the auth endpoints must not carry a (possibly stale) Bearer token. */
const isAuthEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return url.includes(TOKEN_PATH);
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Forced-logout notification -------------------------------------------
// The AuthProvider registers a callback so an interceptor-driven logout
// (refresh failed) also resets in-memory React state.
type AuthFailureListener = () => void;
let authFailureListener: AuthFailureListener | null = null;

export const onAuthFailure = (listener: AuthFailureListener | null): void => {
  authFailureListener = listener;
};

// --- Single-flight refresh -------------------------------------------------
let refreshPromise: Promise<string> | null = null;

/** POST the refresh token via a bare axios call to avoid interceptor recursion. */
const requestRefresh = async (): Promise<string> => {
  const refresh = getRefreshTokenForRequest();
  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  const response = await axios.post<{ access: string }>(
    `${API_BASE_URL}/${REFRESH_PATH}`,
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );

  const access = response.data.access;
  updateSessionAccessToken(access);
  return access;
};

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// --- Interceptors ----------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  if (!isAuthEndpoint(config.url)) {
    const header = getAuthorizationHeader();
    if (header) {
      config.headers.Authorization = header.Authorization;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    const shouldRefresh =
      status === 401 &&
      config !== undefined &&
      !config._retry &&
      !isAuthEndpoint(config.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    try {
      const access = await refreshAccessToken();
      config._retry = true;
      config.headers.Authorization = `Bearer ${access}`;
      return apiClient(config);
    } catch (refreshError) {
      clearSession();
      authFailureListener?.();
      return Promise.reject(refreshError);
    }
  },
);

// --- Auth helpers ----------------------------------------------------------
export type TokenPair = { access: string; refresh: string };

export const postLogin = async (
  username: string,
  password: string,
): Promise<TokenPair> => {
  const response = await apiClient.post<TokenPair>(TOKEN_PATH, {
    username,
    password,
  });
  return response.data;
};

export const postRefresh = async (refresh: string): Promise<string> => {
  const response = await apiClient.post<{ access: string }>(REFRESH_PATH, {
    refresh,
  });
  return response.data.access;
};

export type { AxiosRequestConfig };
