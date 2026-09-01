import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { onAuthFailure, postLogin } from "@/lib/api/client";
import { clearSession, getSession, startSession } from "@/lib/auth";
import { decodeJwt } from "@/lib/auth/jwt";
import { AuthContext } from "./AuthContext";
import type { AuthContextType, User } from "@/types/auth";

/**
 * Authentication provider.
 *
 * Owns session lifecycle: rehydrating a stored session on mount, logging in
 * against the real backend, and clearing everything on logout or on a failed
 * token refresh.
 *
 * Must be rendered INSIDE both the router and the QueryClientProvider:
 *   - it calls useNavigate() to redirect when the refresh interceptor gives up
 *   - it calls queryClient.clear() on logout, so cached project and pile data
 *     from one session cannot leak into the next on a shared site tablet
 */

/**
 * Build a User from an access token.
 *
 * `user_id` is the only identifying claim the backend issues. Roles default to
 * empty, which makes RoleGate fail closed — see the TODO on `User.roles`.
 *
 * The claim's JSON type is NOT stable: SimpleJWT emits a number for an integer
 * primary key but a string when the id is serialised (a UUID pk, or newer
 * versions that stringify it). An earlier version required a number, so a
 * perfectly good token was rejected, login threw, and the UI reported the
 * server as unreachable — a real sign-in failure with a misleading message.
 * Accept both and normalise.
 */
function userFromToken(accessToken: string, username: string): User | null {
  const payload = decodeJwt(accessToken);
  const rawId = payload?.user_id;

  if (rawId === undefined || rawId === null) {
    return null;
  }

  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    username,
    roles: [],
  };
}

const USERNAME_STORAGE_KEY = "yusbuild_username";

/**
 * The backend returns no username, and the JWT carries no username claim, so
 * the only way to show "who am I" in the topbar is to remember what was typed
 * at login. This is display-only and carries no authority.
 */
function readStoredUsername(): string {
  try {
    return window.localStorage.getItem(USERNAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredUsername(username: string): void {
  try {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
  } catch {
    // Blocked storage — the session still works for this tab.
  }
}

function clearStoredUsername(): void {
  try {
    window.localStorage.removeItem(USERNAME_STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}

interface RestoredSession {
  user: User | null;
  accessToken: string | null;
}

/**
 * Read any stored session. Runs during the first render, not in an effect —
 * localStorage is synchronous, so there is no reason to show a loading state.
 */
function restoreSessionFromStorage(): RestoredSession {
  const stored = getSession();
  if (!stored.accessToken) {
    return { user: null, accessToken: null };
  }

  const user = userFromToken(stored.accessToken, readStoredUsername());
  if (!user) {
    // A token we cannot read is not a session. Discard it.
    clearSession();
    clearStoredUsername();
    return { user: null, accessToken: null };
  }

  return { user, accessToken: stored.accessToken };
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Rehydrated synchronously during the first render rather than in an effect.
  // localStorage is a synchronous API, so deferring it would create a frame
  // where a valid session looks unauthenticated — which is exactly what made
  // ProtectedRoute flash the login redirect on hard refresh.
  const [session, setSession] = React.useState<RestoredSession>(
    restoreSessionFromStorage,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const { user, accessToken } = session;

  const clearAuthState = React.useCallback(() => {
    clearSession();
    clearStoredUsername();
    setSession({ user: null, accessToken: null });
    // Drop every cached query so the next session starts clean.
    queryClient.clear();
  }, [queryClient]);

  // The API client performs a single-flight refresh on 401. When that refresh
  // ultimately fails, it notifies here so React state matches the cleared
  // storage and the user lands back on /login.
  React.useEffect(() => {
    onAuthFailure(() => {
      clearAuthState();
      navigate("/login", { replace: true });
    });

    return () => onAuthFailure(null);
  }, [clearAuthState, navigate]);

  const login = React.useCallback(
    async (username: string, password: string): Promise<void> => {
      setIsLoading(true);
      try {
        const tokens = await postLogin(username, password);
        startSession(tokens);
        writeStoredUsername(username);

        const nextUser = userFromToken(tokens.access, username);
        if (!nextUser) {
          clearSession();
          clearStoredUsername();
          throw new Error(
            "Sign-in succeeded but the session token was invalid.",
          );
        }

        setSession({ user: nextUser, accessToken: tokens.access });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = React.useCallback((): void => {
    // NOTE: SimpleJWT has no blacklist configured, so there is no server-side
    // invalidation to call. The refresh token stays valid until it expires.
    // Flagged as a security item in FRONTEND_PLATFORM.md.
    clearAuthState();
  }, [clearAuthState]);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: user !== null && accessToken !== null,
      isLoading,
      accessToken,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
