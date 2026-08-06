import * as React from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";

import { AppShell } from "@/layouts";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider } from "@/providers/AuthProvider";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { NotFoundPage } from "@/features/misc/pages/NotFoundPage";
import { NAV_ITEMS } from "@/layouts/nav.config";
// Aliased to a stub in production builds (see vite.config.ts), so the gallery
// screens and fixtures are dropped from the shipped bundle.
import { devRoutes } from "@/dev/routes";
import { PublicOnlyRoute, ProtectedRoute } from "./ProtectedRoute";

/**
 * Placeholder for modules the feature teams have not built yet.
 *
 * Every domain route currently lands here. As each team ships, they replace
 * their entry with a real route module — see FRONTEND_PLATFORM.md.
 */
function RoadmapPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h1 className="mb-2 text-h1">{title}</h1>
      <p className="text-body text-muted-foreground">
        This module is on the YusBuild roadmap and will be available in an
        upcoming release.
      </p>
    </div>
  );
}

/**
 * Mounts the toaster with the resolved colour scheme. sonner does not read our
 * ThemeProvider, so without this the toast surface stays light in dark mode.
 */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} richColors closeButton />;
}

/**
 * Wraps everything the routes need but that must live *inside* the router:
 * AuthProvider registers a navigate() callback for when the token refresh
 * interceptor gives up, so it cannot sit above RouterProvider.
 */
function RouterShell({ children }: { children: React.ReactNode }) {
  return (
    // NuqsAdapter must sit inside the router: it reads and writes the query
    // string through react-router's own history, so URL state stays in step
    // with navigation instead of fighting it.
    <NuqsAdapter>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          <ThemedToaster />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </NuqsAdapter>
  );
}

/**
 * Prototype routes. Lazily imported so the bundler can drop the subtree — pages
 * and fixture data — from production builds; a static import would keep the
 * module graph alive even behind an `import.meta.env.DEV` check. In production
 * the module is aliased to a stub (see vite.config.ts).
 */
const prototypeRoute: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: "/_prototype/*",
        lazy: async () => {
          const { PrototypeRoutes } = await import("@/_prototype/routes");
          return { Component: PrototypeRoutes };
        },
      },
    ]
  : [];

/**
 * Route table.
 *
 * Uses nested layout routes: ProtectedRoute and AppShell render an <Outlet/>,
 * so they mount ONCE for the session. The previous router wrapped each route in
 * a `ProtectedShell` helper, which rebuilt the element tree per route and
 * remounted the whole chrome on every navigation.
 *
 * A data router (createBrowserRouter) rather than <BrowserRouter> + <Routes>:
 * `useMatches` — and therefore the `handle`-driven breadcrumb trail — only
 * works with a data router.
 *
 * Domain teams: export a `RouteObject[]` from
 * `features/<domain>/routes.tsx` and add it here, so this file stays a
 * composition point rather than a merge-conflict magnet.
 */
const routes: RouteObject[] = [
  {
    element: (
      <RouterShell>
        <PublicOnlyRoute />
      </RouterShell>
    ),
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  // The gallery sits OUTSIDE ProtectedRoute. It renders fixtures and touches no
  // API, so requiring a session would gate a backend-free demo behind a login
  // that cannot succeed without a backend. It is still inside AppShell, so the
  // screens are seen in the real chrome.
  {
    element: (
      <RouterShell>
        <AppShell />
      </RouterShell>
    ),
    children: devRoutes,
  },
  {
    element: (
      <RouterShell>
        <ProtectedRoute />
      </RouterShell>
    ),
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          ...NAV_ITEMS.map((item): RouteObject => ({
            path: item.to,
            element: <RoadmapPage title={item.label} />,
            handle: { crumb: () => ({ label: item.label }) },
          })),
        ],
      },
    ],
  },
  ...prototypeRoute,
  // A real 404 rather than a silent redirect to the dashboard, which used to
  // swallow every typo and broken link.
  { path: "*", element: <NotFoundPage /> },
];

const router = createBrowserRouter(routes);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;

export { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
export type { ProtectedRouteProps } from "./ProtectedRoute";
