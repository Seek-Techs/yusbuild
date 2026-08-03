import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";

import { renderWithProviders, screen, within } from "@/test/render";
import { makeTestJwt } from "@/test/msw/handlers";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth/token-storage";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUiStore } from "@/stores/uiStore";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "./AppShell";

function seedSession() {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, makeTestJwt({ user_id: 7 }));
  window.localStorage.setItem(
    REFRESH_TOKEN_KEY,
    makeTestJwt({ token_type: "refresh" }),
  );
  window.localStorage.setItem("yusbuild_username", "engineer");
}

/** Counts how many times the shell subtree mounts. */
const mountSpy = vi.fn();

function ProbePage({ name }: { name: string }) {
  return (
    <div>
      <h1>{name}</h1>
      <Link to="/piles">Go to piles</Link>
      <Link to="/projects">Go to projects</Link>
    </div>
  );
}

/** Wraps AppShell so mounts can be counted without touching the real one. */
function MountCountingShell() {
  React.useEffect(() => {
    mountSpy();
  }, []);
  return <AppShell />;
}

function renderShell(route = "/projects") {
  // A data router, matching the app: `useMatches` (and therefore the
  // handle-driven breadcrumbs in the topbar) only works with one.
  // AuthProvider calls useNavigate, so it must render inside the router —
  // mirroring how the real router composes it.
  const withAuth = (element: React.ReactElement) => (
    <AuthProvider>
      <TooltipProvider>{element}</TooltipProvider>
    </AuthProvider>
  );

  const testRoutes: RouteObject[] = [
    { path: "/login", element: withAuth(<p>Login page</p>) },
    {
      element: withAuth(<ProtectedRoute />),
      children: [
        {
          element: <MountCountingShell />,
          children: [
            {
              path: "/projects",
              element: <ProbePage name="Projects" />,
              handle: { crumb: () => ({ label: "Projects" }) },
            },
            {
              path: "/piles",
              element: <ProbePage name="Piles" />,
              handle: { crumb: () => ({ label: "Piles" }) },
            },
          ],
        },
      ],
    },
  ];

  const router = createMemoryRouter(testRoutes, { initialEntries: [route] });

  return renderWithProviders(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
    // The tree supplies its own data router; nesting a second one throws.
    { withRouter: false },
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    mountSpy.mockClear();
    useUiStore.setState({ sidebarCollapsed: false });
    seedSession();
  });

  it("renders the shell landmarks", () => {
    renderShell();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /main navigation/i }),
    ).toBeInTheDocument();
  });

  it("puts a skip link first in the tab order", async () => {
    const { user } = renderShell();

    await user.tab();

    const focused = document.activeElement;
    expect(focused).toHaveTextContent(/skip to content/i);
    expect(focused).toHaveAttribute("href", "#main-content");
    // The target must exist, or the skip link silently does nothing.
    expect(document.querySelector("#main-content")).toBeInTheDocument();
  });

  it("does NOT remount when navigating between routes", async () => {
    // Regression guard for the core shell defect. The previous router wrapped
    // every route in a `ProtectedShell` helper, which built a new element tree
    // per route and remounted the whole chrome on each navigation — discarding
    // sidebar state and scroll position. As a layout route it must mount once.
    const { user } = renderShell("/projects");

    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Projects" })).toBeVisible();

    await user.click(screen.getByRole("link", { name: "Go to piles" }));

    expect(screen.getByRole("heading", { name: "Piles" })).toBeVisible();
    expect(mountSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps sidebar collapse state across navigation", async () => {
    const { user } = renderShell("/projects");

    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    await user.click(screen.getByRole("link", { name: "Go to piles" }));

    // Only meaningful because the shell no longer remounts.
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toBeInTheDocument();
  });

  it("marks the current route with aria-current", () => {
    renderShell("/piles");

    const nav = screen.getByRole("navigation", { name: /main navigation/i });
    const current = within(nav).getByRole("link", { current: "page" });
    expect(current).toHaveTextContent("Piles");
  });

  it("announces route changes for screen readers", async () => {
    // SPA navigation is otherwise completely silent to assistive technology.
    const { user, container } = renderShell("/projects");

    await user.click(screen.getByRole("link", { name: "Go to piles" }));

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent(/piles/i);
  });
});
