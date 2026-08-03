/**
 * Authentication types.
 *
 * These match the real backend contract, which is narrower than it looks:
 *
 * - The login endpoint is SimpleJWT's TokenObtainPairView at
 *   `POST /api/auth/token/`. It takes **username**, not email.
 * - Access tokens carry only the stock SimpleJWT claims
 *   (`token_type, exp, iat, jti, user_id`). There is no username, no email and
 *   no groups claim.
 * - There is no `/api/auth/me/` endpoint.
 *
 * The consequence: the frontend cannot currently discover a user's roles. See
 * the `roles` field below and FRONTEND_PLATFORM.md for the backend ask.
 */

export type UserRole = "admin" | "engineer" | "viewer";

export interface User {
  /** Backend primary key, decoded from the JWT `user_id` claim. */
  id: number;
  /** What the user signed in with. The backend does not return this. */
  username: string;
  /**
   * Django group memberships driving write access (admin/engineer can write,
   * viewer is read-only).
   *
   * TODO(backend): this is currently always empty, because no endpoint or token
   * claim exposes it. We default to empty rather than guessing, so `RoleGate`
   * fails closed. Unblocked by either:
   *   (a) GET /api/auth/me/ returning { id, username, email, groups[] }, or
   *   (b) a custom TokenObtainPairSerializer adding a `groups` claim.
   * (a) is preferred — per-project ProjectMembership roles cannot fit in a
   * token, and the 5-minute access lifetime makes claim-based roles go stale.
   */
  roles: UserRole[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /**
   * True while a login request is in flight.
   *
   * Note there is deliberately no `isBootstrapping`: the stored session is
   * restored synchronously during the first render, so `isAuthenticated` is
   * correct immediately and no loading gate is needed on refresh.
   */
  isLoading: boolean;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Response body of POST /api/auth/token/. */
export interface TokenPairResponse {
  access: string;
  refresh: string;
}
