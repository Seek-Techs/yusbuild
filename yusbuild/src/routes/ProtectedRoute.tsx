/**
 * Route guards.
 *
 * These handle authentication only. They do NOT do role-based authorization —
 * that is `RoleGate` for affordances, and the backend for actual enforcement.
 */

import * as React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export interface ProtectedRouteProps {
  /**
   * Optional. Omit to use this as a layout route rendering an <Outlet/>, which
   * is how the app router uses it — that way the guard and the shell below it
   * mount once rather than per route.
   */
  children?: React.ReactNode;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // No loading gate: AuthProvider restores any stored session synchronously
  // during its first render, so this is already correct on a hard refresh.
  if (!isAuthenticated) {
    // `state.from` lets the login page return the user to where they were
    // headed instead of dropping everyone on the dashboard.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children ?? <Outlet />}</>;
}

/**
 * Keeps signed-in users off the login page. Without this, a returning user who
 * navigates to /login sees a sign-in form for a session they already have.
 */
export function PublicOnlyRoute({
  children,
}: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
