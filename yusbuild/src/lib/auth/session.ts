import {
  clearAuthTokens,
  getAccessToken,
  getAuthTokens,
  getRefreshToken,
  hasAccessToken,
  setAccessToken,
  setAuthTokens,
  type AuthTokens,
} from "./token-storage";

export type SessionStatus = "authenticated" | "unauthenticated";

export type AuthSession = {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
};

export const getSession = (): AuthSession => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  return {
    status: accessToken ? "authenticated" : "unauthenticated",
    accessToken,
    refreshToken,
  };
};

export const hasSession = (): boolean => {
  return hasAccessToken();
};

export const startSession = (tokens: AuthTokens): AuthSession => {
  setAuthTokens(tokens);

  return {
    status: "authenticated",
    accessToken: tokens.access,
    refreshToken: tokens.refresh,
  };
};

export const updateSessionAccessToken = (accessToken: string): AuthSession => {
  setAccessToken(accessToken);

  return {
    status: "authenticated",
    accessToken,
    refreshToken: getRefreshToken(),
  };
};

export const clearSession = (): AuthSession => {
  clearAuthTokens();

  return {
    status: "unauthenticated",
    accessToken: null,
    refreshToken: null,
  };
};

export const getBearerToken = (): string | null => {
  const accessToken = getAccessToken();
  return accessToken ? `Bearer ${accessToken}` : null;
};

export const getAuthorizationHeader = (): Record<
  "Authorization",
  string
> | null => {
  const bearerToken = getBearerToken();

  if (!bearerToken) {
    return null;
  }

  return {
    Authorization: bearerToken,
  };
};

export const getRefreshTokenForRequest = (): string | null => {
  return getAuthTokens()?.refresh ?? null;
};
