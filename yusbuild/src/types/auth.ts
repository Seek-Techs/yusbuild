/**
 * Authentication types and interfaces
 * 
 * Defines User model and Auth context contracts.
 * Aligned with backend JWT + role-based permission model.
 */

export type UserRole = "admin" | "engineer" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  groups: string[];
}

export interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}
