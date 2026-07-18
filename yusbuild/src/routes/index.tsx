import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "@/layouts";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ProjectBoqPage } from "@/features/projects/pages/ProjectBoqPage";
import { ProjectDetailPage } from "@/features/projects/pages/ProjectDetailPage";
import { NewProjectPage } from "@/features/projects/pages/NewProjectPage";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";
import { PileDetailPage } from "@/features/piles/pages/PileDetailPage";
import { NewPilePage } from "@/features/piles/pages/NewPilePage";
import { PilesPage } from "@/features/piles/pages/PilesPage";

function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function RoadmapPage({ title }: { title: string }) {
  return (
  <AppShell>
    <div className="rounded-md border bg-card p-6">
      <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        This module is on the YusBuild roadmap and will be available in an
        upcoming release.
      </p>
    </div>
  </AppShell>
  );
}

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

        <Route
          path="/dashboard"
          element={<ProtectedShell><DashboardPage /></ProtectedShell>}
        />
        <Route path="/projects" element={<ProtectedShell><ProjectsPage /></ProtectedShell>} />
        <Route
          path="/projects/new"
          element={<ProtectedShell><NewProjectPage /></ProtectedShell>}
        />
        <Route
          path="/projects/:projectId"
          element={<ProtectedShell><ProjectDetailPage /></ProtectedShell>}
        />
        <Route
          path="/projects/:projectId/boq"
          element={<ProtectedShell><ProjectBoqPage /></ProtectedShell>}
        />
        <Route path="/piles" element={<ProtectedShell><PilesPage /></ProtectedShell>} />
        <Route
          path="/piles/new"
          element={<ProtectedShell><NewPilePage /></ProtectedShell>}
        />
        <Route
          path="/piles/:pileId"
          element={<ProtectedShell><PileDetailPage /></ProtectedShell>}
        />
        <Route
          path="/execution"
          element={<ProtectedRoute><RoadmapPage title="Execution" /></ProtectedRoute>}
        />
        <Route
          path="/evidence"
          element={<ProtectedRoute><RoadmapPage title="Evidence" /></ProtectedRoute>}
        />
        <Route
          path="/verification"
          element={<ProtectedRoute><RoadmapPage title="Verification" /></ProtectedRoute>}
        />
        <Route
          path="/approvals"
          element={<ProtectedRoute><RoadmapPage title="Approvals" /></ProtectedRoute>}
        />
        <Route
          path="/certification"
          element={<ProtectedRoute><RoadmapPage title="Certification" /></ProtectedRoute>}
        />
        <Route
          path="/audit"
          element={<ProtectedRoute><RoadmapPage title="Audit" /></ProtectedRoute>}
        />

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
