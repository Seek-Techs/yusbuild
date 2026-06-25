/**
 * ProtectedRoute - Authorization boundary for authenticated pages
 * 
 * Enforces authentication requirement for route access.
 * Implements React Router pattern for gated content.
 * 
 * Responsibilities:
 * - Check authentication state from AuthProvider
 * - Render component if authenticated
 * - Redirect to login if not authenticated
 * - Show loading state during auth check (if needed)
 * 
 * Architecture:
 * - Thin wrapper: only checks auth, does not implement business logic
 * - Owns: auth boundary enforcement only
 * - Does NOT: validate permissions beyond authentication
 * - Does NOT: implement role-based access control (future concern)
 */

import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component
 * 
 * Usage in router configuration:
 * ```
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <DashboardPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 * 
 * Flow:
 * 1. Read auth state from context
 * 2. If authenticated: render children
 * 3. If not authenticated: redirect to /login
 * 4. If loading: optionally show skeleton (not implemented - stretch goal)
 * 
 * Why not use Outlet pattern?
 * - Outlet requires nested route structure
 * - Wrapping allows flexibility in page composition
 * - Compatible with page-level component tree
 */
export function ProtectedRoute({
  children,
}: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  // Unauthenticated: redirect to login
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Loading: show placeholder (can be enhanced with skeleton in future)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated: render children
  return <>{children}</>;
}
