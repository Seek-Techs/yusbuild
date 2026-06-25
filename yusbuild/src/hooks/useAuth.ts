/**
 * useAuth - Hook to access authentication context
 * 
 * Separated from AuthProvider component to satisfy React Fast Refresh rules
 * (only components in a file with non-component exports).
 * 
 * Throws if used outside AuthProvider.
 * Consumers include:
 * - ProtectedRoute: checks isAuthenticated before rendering
 * - Page components: access user data for role-aware UI affordances
 * - Hooks: access token for API request headers
 * 
 * Do NOT use for:
 * - Storing page-specific UI state (use useState)
 * - Storing form data (use react-hook-form)
 * - Calling API endpoints (use domain hooks)
 */

import * as React from "react";
import { AuthContext } from "@/providers/AuthContext";
import type { AuthContextType } from "@/types/auth";

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
