import { useAuth } from "./useAuth";
import type { UserRole } from "@/types/auth";

/**
 * Role predicates.
 *
 * IMPORTANT — these drive affordances, not authorization. Hiding or disabling
 * a control is a usability courtesy; the backend is the only authority, and
 * every screen must still handle a 403 on the response.
 *
 * Roles are currently always empty: the backend exposes no groups claim and no
 * /me endpoint (see User.roles). These therefore fail CLOSED — write
 * affordances are withheld rather than granted on an assumption we cannot
 * verify. Closing the backend gap turns them on with no change here.
 */

/** Groups permitted to write, mirroring the backend's IsAdminEngineerOrReadOnly. */
export const WRITE_ROLES: UserRole[] = ["admin", "engineer"];

export function useHasRole(...roles: UserRole[]): boolean {
  const { user } = useAuth();
  if (roles.length === 0) return true;
  return roles.some((role) => user?.roles.includes(role) ?? false);
}

/** True when the user may perform write operations. */
export function useCanWrite(): boolean {
  return useHasRole(...WRITE_ROLES);
}

/** True when the user is explicitly read-only. */
export function useIsViewer(): boolean {
  const { user } = useAuth();
  return user?.roles.includes("viewer") ?? false;
}
