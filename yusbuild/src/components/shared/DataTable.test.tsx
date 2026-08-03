import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, within } from "@/test/render";
import type { NormalizedError } from "@/lib/api/errors";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Pile {
  id: number;
  pile_no: string;
  steel_kg: number;
}

const ROWS: Pile[] = [
  { id: 1, pile_no: "P-001", steel_kg: 720.5 },
  { id: 2, pile_no: "P-002", steel_kg: 220.3 },
];

const COLUMNS: DataTableColumn<Pile>[] = [
  { id: "pile_no", header: "Pile", cell: (row) => row.pile_no, sortable: true },
  {
    id: "steel_kg",
    header: "Steel",
    cell: (row) => row.steel_kg,
    align: "right",
    sortable: true,
  },
];

function renderTable(
  props: Partial<React.ComponentProps<typeof DataTable<Pile>>> = {},
) {
  return renderWithProviders(
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      getRowId={(row) => row.id}
      caption="Piles"
      {...props}
    />,
  );
}

describe("DataTable", () => {
  describe("state precedence", () => {
    // An error must win over stale rows, and a genuine empty result must not
    // be mistaken for "still loading".
    it("shows the error state even when rows are present", () => {
      const error: NormalizedError = {
        kind: "server",
        status: 500,
        message: "Something went wrong on our end.",
        raw: null,
      };

      renderTable({ error, rows: ROWS });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong",
      );
      expect(screen.queryByText("P-001")).not.toBeInTheDocument();
    });

    it("shows skeletons while loading with no rows yet", () => {
      renderTable({ isLoading: true, rows: undefined, skeletonRows: 3 });

      expect(screen.queryByText("P-001")).not.toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3
    });

    it("shows the empty state for a genuinely empty result", () => {
      renderTable({ rows: [] });

      expect(screen.getByText(/nothing to show/i)).toBeInTheDocument();
    });

    it("renders rows once loaded", () => {
      renderTable();

      expect(screen.getByText("P-001")).toBeInTheDocument();
      expect(screen.getByText("P-002")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("cycles ascending, descending, then unsorted", async () => {
      const onOrderingChange = vi.fn();
      const { user, rerender } = renderTable({
        sorting: { ordering: null, onOrderingChange },
      });

      await user.click(screen.getByRole("button", { name: /pile/i }));
      expect(onOrderingChange).toHaveBeenLastCalledWith("pile_no");

      rerender(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          getRowId={(row) => row.id}
          caption="Piles"
          sorting={{ ordering: "pile_no", onOrderingChange }}
        />,
      );
      await user.click(screen.getByRole("button", { name: /pile/i }));
      // DRF descending prefix.
      expect(onOrderingChange).toHaveBeenLastCalledWith("-pile_no");

      rerender(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          getRowId={(row) => row.id}
          caption="Piles"
          sorting={{ ordering: "-pile_no", onOrderingChange }}
        />,
      );
      await user.click(screen.getByRole("button", { name: /pile/i }));
      expect(onOrderingChange).toHaveBeenLastCalledWith(null);
    });

    it("exposes the sort direction via aria-sort", () => {
      renderTable({
        sorting: { ordering: "-steel_kg", onOrderingChange: vi.fn() },
      });

      const header = screen.getByRole("columnheader", { name: /steel/i });
      expect(header).toHaveAttribute("aria-sort", "descending");
    });

    it("does not render sort controls without a sorting handler", () => {
      renderTable();

      expect(
        screen.queryByRole("button", { name: /pile/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("renders row links as real anchors", () => {
    // So middle-click, open-in-new-tab and copy-link-address all work —
    // engineers share references to specific records constantly.
    renderTable({ rowHref: (row) => `/piles/${row.id}` });

    const links = screen.getAllByRole("link", { name: /open/i });
    expect(links[0]).toHaveAttribute("href", "/piles/1");
  });

  it("gives the table an accessible caption", () => {
    renderTable();

    expect(screen.getByRole("table", { name: "Piles" })).toBeInTheDocument();
  });

  it("right-aligns numeric columns with tabular figures", () => {
    // Quantity columns that jitter between rows are hard to scan.
    renderTable();

    const firstRow = screen.getAllByRole("row")[1]!;
    const steelCell = within(firstRow).getByText("720.5");
    expect(steelCell.className).toContain("text-right");
    expect(steelCell.className).toContain("tabular-nums");
  });

  it("hides pagination for a single page", () => {
    renderTable({
      pagination: { page: 1, count: 2, onPageChange: vi.fn() },
    });

    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("paginates when there is more than one page", async () => {
    const onPageChange = vi.fn();
    const { user } = renderTable({
      pagination: { page: 1, count: 120, onPageChange },
    });

    expect(screen.getByText(/showing/i)).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
