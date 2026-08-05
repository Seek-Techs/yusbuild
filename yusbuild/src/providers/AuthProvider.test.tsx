import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";

import { renderWithProviders, screen, waitFor } from "@/test/render";
import { makeTestJwt } from "@/test/msw/handlers";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth/token-storage";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AuthProvider } from "./AuthProvider";

function AuthProbe() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.username ?? "-"}</span>
      <span data-testid="userid">{user?.id ?? "-"}</span>
      <span data-testid="rolecount">{user?.roles.length ?? -1}</span>
      <button onClick={() => login("engineer", "correct-horse")}>
        sign in
      </button>
      <button onClick={logout}>sign out</button>
    </div>
  );
}

/** Put a valid-looking session in storage, as a returning user would have. */
function seedStoredSession(userId = 7, username = "stored.engineer") {
  window.localStorage.setItem(
    ACCESS_TOKEN_KEY,
    makeTestJwt({ user_id: userId }),
  );
  window.localStorage.setItem(
    REFRESH_TOKEN_KEY,
    makeTestJwt({ token_type: "refresh" }),
  );
  window.localStorage.setItem("yusbuild_username", username);
}

describe("AuthProvider", () => {
  it("starts unauthenticated with empty storage", () => {
    renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
  });

  it("restores a stored session on the FIRST render", () => {
    // Regression guard. Reading storage in an effect leaves one frame where a
    // valid session looks unauthenticated, which made ProtectedRoute bounce
    // returning users to /login on every hard refresh. No waitFor here: the
    // assertion must hold synchronously.
    seedStoredSession(7, "stored.engineer");

    renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authed")).toHaveTextContent("true");
    expect(screen.getByTestId("userid")).toHaveTextContent("7");
    expect(screen.getByTestId("username")).toHaveTextContent("stored.engineer");
  });

  it("does not flash a login redirect for a stored session", () => {
    seedStoredSession();

    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <p>Dashboard</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>,
      { route: "/dashboard" },
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("discards a stored token it cannot decode", () => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "not-a-jwt");
    window.localStorage.setItem(REFRESH_TOKEN_KEY, "not-a-jwt");

    renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("signs in against the real token endpoint", async () => {
    const { user } = renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByText("sign in"));

    await waitFor(() =>
      expect(screen.getByTestId("authed")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("username")).toHaveTextContent("engineer");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeTruthy();
  });

  it("defaults roles to empty so role gates fail closed", async () => {
    // The backend issues no groups claim and exposes no /me endpoint, so the
    // frontend genuinely cannot know a user's roles. Guessing here would grant
    // affordances we cannot verify.
    seedStoredSession();

    renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("rolecount")).toHaveTextContent("0");
  });

  it("clears tokens and cached data on sign out", async () => {
    seedStoredSession();

    const { user, queryClient } = renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    queryClient.setQueryData(["projects", "list"], [{ id: 1 }]);
    await user.click(screen.getByText("sign out"));

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    // The cache must be dropped too, or on a shared site tablet the next user
    // sees the previous user's project list.
    expect(queryClient.getQueryData(["projects", "list"])).toBeUndefined();
  });
});
