import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PageSkeleton } from "@/components/shared/Loaders";
import { ContentLayout } from "./ContentLayout";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRouteAnnouncer } from "./useRouteAnnouncer";

/**
 * The application shell.
 *
 * Renders an <Outlet/> as a layout route, so it mounts ONCE for the whole
 * session. The previous version took `children` and was re-wrapped per route,
 * which unmounted and remounted the entire shell on every navigation —
 * discarding sidebar scroll position and making persisted collapse state
 * impossible.
 *
 * Scroll model: the document scrolls, not a container. `overflow-y-auto` on the
 * content pane (the old approach) had no effect, because nothing constrained
 * the height — and it silently defeated `position: sticky` on the topbar. Only
 * the sidebar is independently scrollable.
 */
export function AppShell() {
  const location = useLocation();
  const { announcement, mainRef } = useRouteAnnouncer();

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* First focusable element on the page: lets keyboard users jump past
          the navigation instead of tabbing through it on every route. */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Topbar />

      <div className="flex">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <ContentLayout ref={mainRef}>
            <QueryErrorResetBoundary>
              {({ reset }) => (
                <ErrorBoundary
                  onReset={reset}
                  // Navigating away from a broken screen clears the error,
                  // rather than leaving the fallback stuck in place forever.
                  resetKeys={[location.pathname]}
                >
                  <React.Suspense fallback={<PageSkeleton />}>
                    <Outlet />
                  </React.Suspense>
                </ErrorBoundary>
              )}
            </QueryErrorResetBoundary>
          </ContentLayout>

          <div className="border-t px-4 py-3 sm:px-6 lg:px-8">
            <Footer />
          </div>
        </div>
      </div>

      {/* Route changes are otherwise silent for screen readers. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
