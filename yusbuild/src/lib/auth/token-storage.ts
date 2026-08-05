const ACCESS_TOKEN_KEY = "yusbuild_access_token";
const REFRESH_TOKEN_KEY = "yusbuild_refresh_token";

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type StoredAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

const canUseLocalStorage = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  } catch {
    return false;
  }
};

const normalizeToken = (token: string): string => token.trim();

const isUsableToken = (token: string | null | undefined): token is string => {
  return typeof token === "string" && normalizeToken(token).length > 0;
};

export const getAccessToken = (): string | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  return isUsableToken(token) ? token : null;
};

export const getRefreshToken = (): string | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const token = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  return isUsableToken(token) ? token : null;
};

export const getStoredTokens = (): StoredAuthTokens => {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
};

export const getAuthTokens = (): AuthTokens | null => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access: accessToken,
    refresh: refreshToken,
  };
};

export const setAuthTokens = (tokens: AuthTokens): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  const accessToken = normalizeToken(tokens.access);
  const refreshToken = normalizeToken(tokens.refresh);

  if (!accessToken || !refreshToken) {
    throw new Error(
      "Auth tokens must include non-empty access and refresh values.",
    );
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const setAccessToken = (accessToken: string): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedToken = normalizeToken(accessToken);

  if (!normalizedToken) {
    throw new Error("Access token must be a non-empty string.");
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, normalizedToken);
};

export const clearAuthTokens = (): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const hasAccessToken = (): boolean => {
  return getAccessToken() !== null;
};

export const hasRefreshToken = (): boolean => {
  return getRefreshToken() !== null;
};

export const hasAuthTokens = (): boolean => {
  return hasAccessToken() && hasRefreshToken();
};

export const tokenStorage = {
  getAccessToken,
  getRefreshToken,
  getStoredTokens,
  getAuthTokens,
  setAuthTokens,
  setAccessToken,
  clearAuthTokens,
  hasAccessToken,
  hasRefreshToken,
  hasAuthTokens,
};

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
