import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Plus } from "lucide-react";
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";

import { renderWithProviders, screen } from "@/test/render";
import { makeTestJwt } from "@/test/msw/handlers";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth/token-storage";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/layouts/AppShell";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import {
  ConfirmDialog,
  DataTable,
  DatePicker,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  FormPageLayout,
  Pagination,
  SearchInput,
  StatCard,
  StatCardGrid,
  StatusBadge,
  type DataTableColumn,
  type StatusMap,
} from "@/components/shared";

/**
 * Accessibility smoke tests.
 *
 * Deliberately scoped to the shell and the highest-traffic shared components
 * rather than every export. A blanket axe sweep produces noise that gets muted,
 * and axe only catches machine-detectable failures anyway — it is a floor, not
 * a substitute for the keyboard and screen-reader passes in the verification
 * checklist.
 *
 * What this does catch, and what would otherwise ship silently: unlabelled
 * controls, missing table headers, broken ARIA references, and duplicate ids.
 */

interface Row {
  id: number;
  pile_no: string;
  steel_kg: number;
}

const ROWS: Row[] = [
  { id: 1, pile_no: "P-001", steel_kg: 720.5 },
  { id: 2, pile_no: "P-002", steel_kg: 220.3 },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "pile_no", header: "Pile", cell: (row) => row.pile_no, sortable: true },
  {
    id: "steel_kg",
    header: "Steel",
    cell: (row) => row.steel_kg,
    align: "right",
    sortable: true,
  },
];

const STATUS_MAP: StatusMap = {
  ACTIVE: { label: "Active", tone: "success" },
};

function seedSession() {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, makeTestJwt({ user_id: 1 }));
  window.localStorage.setItem(
    REFRESH_TOKEN_KEY,
    makeTestJwt({ token_type: "refresh" }),
  );
  window.localStorage.setItem("yusbuild_username", "engineer");
}

describe("accessibility", () => {
  describe("app shell", () => {
    it("has no detectable violations", async () => {
      seedSession();

      const routes: RouteObject[] = [
        {
          element: (
            <AuthProvider>
              <TooltipProvider>
                <ProtectedRoute />
              </TooltipProvider>
            </AuthProvider>
          ),
          children: [
            {
              element: <AppShell />,
              children: [
                {
                  path: "/projects",
                  element: <h1>Projects</h1>,
                },
              ],
            },
          ],
        },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/projects"],
      });

      const { container } = renderWithProviders(
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>,
        { withRouter: false },
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("data display", () => {
    it("DataTable has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          getRowId={(row) => row.id}
          rowHref={(row) => `/piles/${row.id}`}
          caption="Piles"
          sorting={{ ordering: "-steel_kg", onOrderingChange: () => {} }}
          pagination={{ page: 1, count: 120, onPageChange: () => {} }}
        />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("DataTable loading and empty states have no violations", async () => {
      const loading = renderWithProviders(
        <DataTable
          columns={COLUMNS}
          rows={undefined}
          isLoading
          getRowId={(row) => row.id}
          caption="Piles"
        />,
      );
      expect(await axe(loading.container)).toHaveNoViolations();
      loading.unmount();

      const empty = renderWithProviders(
        <DataTable
          columns={COLUMNS}
          rows={[]}
          getRowId={(row) => row.id}
          caption="Piles"
        />,
      );
      expect(await axe(empty.container)).toHaveNoViolations();
    });

    it("StatCard grid has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <StatCardGrid>
          <StatCard label="Projects" value={8} tone="blue" />
          <StatCard
            label="Total Steel"
            value="45.60 t"
            tone="green"
            trend={{ value: "12%", direction: "up" }}
          />
          <StatCard
            label="Status"
            value={<StatusBadge status="ACTIVE" map={STATUS_MAP} />}
          />
        </StatCardGrid>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("Pagination has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <Pagination page={2} count={120} onPageChange={() => {}} />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("states", () => {
    it("EmptyState has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <EmptyState
          title="No piles yet"
          description="Import a pile schedule to get started."
          action={<Button>Import CSV</Button>}
        />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("ErrorState has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <ErrorState
          error={{
            kind: "server",
            status: 500,
            message: "Something went wrong.",
            raw: null,
          }}
          onRetry={() => {}}
        />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("forms and filters", () => {
    it("FilterBar has no detectable violations", async () => {
      // The search input is placeholder-only by design, so its accessible name
      // comes from a visually-hidden label — exactly the kind of thing that
      // regresses unnoticed.
      const { container } = renderWithProviders(
        <FilterBar
          search={<SearchInput value="" onChange={() => {}} />}
          filters={
            <FilterSelect
              label="Type"
              value={null}
              onChange={() => {}}
              options={[{ label: "Type I", value: "TYPE_I" }]}
            />
          }
          activeFilterCount={1}
          onClearAll={() => {}}
          actions={
            <Button>
              <Plus aria-hidden="true" /> New pile
            </Button>
          }
        />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("FormPageLayout has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <FormPageLayout
          title="New pile"
          description="Record a pile against this project."
          onSubmit={(event) => event.preventDefault()}
          cancelTo="/piles"
        >
          <label htmlFor="pile-no">Pile number</label>
          <input id="pile-no" />
        </FormPageLayout>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("DatePicker has no detectable violations", async () => {
      const { container } = renderWithProviders(
        <DatePicker
          value={new Date("2026-07-30T00:00:00")}
          onChange={() => {}}
        />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("overlays", () => {
    it("ConfirmDialog has no detectable violations", async () => {
      renderWithProviders(
        <ConfirmDialog
          open
          onOpenChange={() => {}}
          title="Lock package"
          description="This cannot be undone."
          onConfirm={() => {}}
        />,
      );

      // Radix portals the dialog outside the render container, so the whole
      // document is the subject here.
      expect(await axe(document.body)).toHaveNoViolations();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });
});
