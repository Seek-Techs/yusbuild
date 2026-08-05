/**
 * Prototype routes — development only.
 *
 * Mounted from `src/routes/index.tsx` behind `import.meta.env.DEV`, so these
 * pages and their fixture data are tree-shaken out of production builds.
 *
 * These screens render from hardcoded fixtures and are kept purely as a visual
 * reference. See ./README.md before copying anything out of them.
 */
import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/routes/ProtectedRoute";

import { DashboardPage } from "./dashboard/pages/DashboardPage";
import { NewPilePage } from "./piles/pages/NewPilePage";
import { PileDetailPage } from "./piles/pages/PileDetailPage";
import { PilesPage } from "./piles/pages/PilesPage";
import { NewProjectPage } from "./projects/pages/NewProjectPage";
import { ProjectBoqPage } from "./projects/pages/ProjectBoqPage";
import { ProjectDetailPage } from "./projects/pages/ProjectDetailPage";
import { ProjectsPage } from "./projects/pages/ProjectsPage";

/**
 * A minimal standalone frame.
 *
 * Deliberately does NOT use the real AppShell: the prototype is frozen
 * reference material, and coupling it to a shell that is actively being rebuilt
 * would mean every shell change had to keep these dead screens compiling.
 */
function PrototypeShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-svh bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-4 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">
              Prototype preview.
            </strong>{" "}
            This screen renders hardcoded fixture data and is kept as a visual
            reference only. It is not part of the application.
          </div>
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}

const PROTOTYPE_PAGES = [
  { path: "dashboard", element: <DashboardPage /> },
  { path: "projects", element: <ProjectsPage /> },
  { path: "projects/new", element: <NewProjectPage /> },
  { path: "projects/:projectId", element: <ProjectDetailPage /> },
  { path: "projects/:projectId/boq", element: <ProjectBoqPage /> },
  { path: "piles", element: <PilesPage /> },
  { path: "piles/new", element: <NewPilePage /> },
  { path: "piles/:pileId", element: <PileDetailPage /> },
];

/**
 * Rendered under the `/_prototype/*` splat route, so paths here are relative.
 * Exported as a component (not a Route array) so the parent can pull it in via
 * `React.lazy` and keep it out of production bundles entirely.
 */
export function PrototypeRoutes() {
  return (
    <Routes>
      {PROTOTYPE_PAGES.map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={<PrototypeShell>{page.element}</PrototypeShell>}
        />
      ))}
    </Routes>
  );
}
