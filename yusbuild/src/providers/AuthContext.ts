/**
 * AuthContext - Authentication Context
 *
 * Separated to a dedicated file to satisfy React Fast Refresh rules
 * (only components in a file with non-component exports).
 *
 * This context holds the authentication state and is consumed by
 * AuthProvider and useAuth hook.
 */

import * as React from "react";
import type { AuthContextType } from "@/types/auth";

export const AuthContext = React.createContext<AuthContextType | undefined>(
  undefined,
);
