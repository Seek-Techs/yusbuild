/**
 * Router configuration and route exports
 * 
 * Defines application routes and route-level component exports.
 * Integrates AuthProvider for all routes.
 * 
 * Current status:
 * - Phase 4: Authentication infrastructure only
 * - Routes are placeholders for future feature modules
 * - No business logic (workflows, dashboards, forms) implemented yet
 * 
 * Future phases will add:
 * - Phase 5: Projects feature
 * - Phase 6: Piles feature
 * - Phase 7-10: Execution, Evidence, Verification, Approvals, Certification, Audit
 */

import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "@/layouts";

/**
 * Login page placeholder
 * 
 * FUTURE IMPLEMENTATION:
 * - Extract to pages/auth/LoginPage.tsx
 * - Implement login form with react-hook-form
 * - Call login() from AuthProvider
 * - Navigate to dashboard on success
 */
const LoginPage: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Login</h1>
      <p className="text-sm text-muted-foreground">
        Authentication page placeholder. Use useAuth() hook in LoginPage
        component to call login() method.
      </p>
    </div>
  </div>
);

/**
 * Dashboard page placeholder
 * 
 * FUTURE IMPLEMENTATION:
 * - Extract to pages/dashboard/DashboardPage.tsx
 * - Implement role-aware dashboard layout
 * - Display project/pile/workflow summaries per domain
 * - Navigation to domain feature modules
 */
const DashboardPage: React.FC = () => (
  <AppShell>
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Protected route rendering successfully. Auth boundary enforced by
        ProtectedRoute wrapper.
      </p>
    </div>
  </AppShell>
);

/**
 * Router component
 * 
 * Wraps all routes with AuthProvider to make authentication state
 * available to entire application.
 * 
 * Architecture:
 * - AuthProvider is root wrapper (all pages have access to useAuth())
 * - Login page is public (no ProtectedRoute wrapper)
 * - Protected pages wrapped in ProtectedRoute (enforces isAuthenticated)
 * - Default route redirects to appropriate page based on auth state
 */
export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Feature routes (placeholder for future domains) */}
        {/* Phase 5: Projects */}
        {/* <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} /> */}

        {/* Phase 6: Piles */}
        {/* <Route path="/piles" element={<ProtectedRoute><PilesPage /></ProtectedRoute>} /> */}

        {/* Phase 7: Execution */}
        {/* <Route path="/execution" element={<ProtectedRoute><ExecutionPage /></ProtectedRoute>} /> */}

        {/* Phase 8: Evidence */}
        {/* <Route path="/evidence" element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} /> */}

        {/* Phase 9: Verification */}
        {/* <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} /> */}

        {/* Phase 10: Approvals */}
        {/* <Route path="/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} /> */}

        {/* Phase 11: Certification */}
        {/* <Route path="/certification" element={<ProtectedRoute><CertificationPage /></ProtectedRoute>} /> */}

        {/* Phase 12: Audit */}
        {/* <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} /> */}

        {/* Default route - redirect to dashboard if authenticated, else to login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

// Export types for route-related components
export { ProtectedRoute } from "./ProtectedRoute";
export type { ProtectedRouteProps } from "./ProtectedRoute";
