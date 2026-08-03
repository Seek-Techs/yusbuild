import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, waitFor, within } from "@/test/render";
import {
  formatKg,
  formatM3,
  formatMetres,
  formatNumber,
} from "@/lib/format/number";
import { formatDate, fromApiDate, toApiDate } from "@/lib/format/date";
import { DatePicker } from "./DatePicker";
import { DescriptionList, InfoTile } from "./InfoTile";
import { DetailTabs } from "./DetailTabs";
import { FileDropzone } from "./FileDropzone";
import { FormPageLayout, SuccessBanner } from "./FormPageLayout";

describe("format helpers", () => {
  it("emits the superscript unit for concrete volume", () => {
    // The prototype emitted "m3", which is wrong in an engineering document.
    expect(formatM3(174.72)).toBe("174.720 m³");
  });

  it("formats quantities with fixed precision", () => {
    expect(formatKg(27823.3)).toBe("27,823.30 kg");
    expect(formatMetres(20)).toBe("20.0 m");
  });

  it("returns an em dash rather than NaN for absent values", () => {
    // A table cell reading "NaN kg" is worse than one reading "—".
    for (const input of [null, undefined, "", "abc", Number.NaN]) {
      expect(formatNumber(input)).toBe("—");
      expect(formatKg(input)).toBe("—");
    }
  });

  it("returns an em dash rather than Invalid Date", () => {
    for (const input of [null, undefined, "", "not-a-date"]) {
      expect(formatDate(input)).toBe("—");
    }
  });

  it("round-trips an API date", () => {
    // The backend's date fields are plain YYYY-MM-DD with no timezone.
    const parsed = fromApiDate("2026-07-30");
    expect(parsed).toBeInstanceOf(Date);
    expect(toApiDate(parsed)).toBe("2026-07-30");
  });

  it("omits an absent date rather than sending null", () => {
    expect(toApiDate(null)).toBeUndefined();
  });
});

describe("InfoTile", () => {
  it("renders title, description and trailing slot", () => {
    renderWithProviders(
      <InfoTile
        title="Calculation v3"
        description="Recalculated after config change"
        trailing={<span>2h ago</span>}
      />,
    );

    expect(screen.getByText("Calculation v3")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });

  it("renders as a link when given an href", () => {
    renderWithProviders(<InfoTile title="Open pile" href="/piles/1" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/piles/1");
  });
});

describe("DescriptionList", () => {
  it("pairs labels with values and falls back for empty ones", () => {
    renderWithProviders(
      <DescriptionList
        items={[
          { label: "Pile type", value: "TYPE_II" },
          { label: "Drawing ref", value: null },
        ]}
      />,
    );

    expect(screen.getByText("Pile type")).toBeInTheDocument();
    expect(screen.getByText("TYPE_II")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("DetailTabs", () => {
  const TABS = [
    { value: "piles", label: "Piles", content: <p>Piles panel</p> },
    { value: "boq", label: "BOQ", content: <p>BOQ panel</p> },
  ];

  it("opens the tab named in the URL", () => {
    // So a colleague can link to the BOQ tab, not just the record.
    renderWithProviders(<DetailTabs tabs={TABS} />, {
      route: "/projects/1?tab=boq",
    });

    expect(screen.getByText("BOQ panel")).toBeInTheDocument();
  });

  it("falls back when the URL names a tab that no longer exists", () => {
    // Old links survive a tab being renamed, rather than showing an empty panel.
    renderWithProviders(<DetailTabs tabs={TABS} />, {
      route: "/projects/1?tab=documents",
    });

    expect(screen.getByText("Piles panel")).toBeInTheDocument();
  });

  it("writes the active tab to the URL", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<DetailTabs tabs={TABS} />, {
      route: "/projects/1",
      onUrlUpdate,
    });

    await user.click(screen.getByRole("tab", { name: "BOQ" }));

    await waitFor(() => {
      const calls = onUrlUpdate.mock.calls;
      const last = calls[calls.length - 1]?.[0] as { queryString: string };
      expect(last.queryString).toContain("tab=boq");
    });
  });
});

describe("FileDropzone", () => {
  it("exposes a keyboard-operable trigger", () => {
    // A div with drag handlers is unusable without a mouse.
    renderWithProviders(<FileDropzone onFilesSelected={vi.fn()} />);
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("rejects a file over the size limit", async () => {
    const onFilesSelected = vi.fn();
    renderWithProviders(
      <FileDropzone onFilesSelected={onFilesSelected} maxSizeBytes={10} />,
    );

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    const file = new File(["x".repeat(50)], "piles.csv", { type: "text/csv" });
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it("lists staged files with a remove control", () => {
    const file = new File(["a"], "piles.csv", { type: "text/csv" });
    renderWithProviders(
      <FileDropzone
        onFilesSelected={vi.fn()}
        files={[file]}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("piles.csv")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove piles.csv/i }),
    ).toBeInTheDocument();
  });
});

describe("FormPageLayout", () => {
  it("submits through the form element", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { user } = renderWithProviders(
      <FormPageLayout title="New pile" onSubmit={onSubmit} cancelTo="/piles">
        <input aria-label="Pile number" />
      </FormPageLayout>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables submit while in flight", () => {
    renderWithProviders(
      <FormPageLayout
        title="New pile"
        onSubmit={vi.fn()}
        cancelTo="/piles"
        isSubmitting
      >
        <input aria-label="Pile number" />
      </FormPageLayout>,
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("links cancel back to the list", () => {
    renderWithProviders(
      <FormPageLayout title="New pile" onSubmit={vi.fn()} cancelTo="/piles">
        <input aria-label="Pile number" />
      </FormPageLayout>,
    );

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/piles",
    );
  });
});

describe("SuccessBanner", () => {
  it("announces politely rather than interrupting", () => {
    // A successful outcome should not preempt what the user is doing, so this
    // is role="status", not role="alert".
    renderWithProviders(<SuccessBanner title="Pile created" />);

    const banner = screen.getByRole("status");
    expect(within(banner).getByText("Pile created")).toBeInTheDocument();
  });
});

describe("DatePicker", () => {
  it("shows the placeholder when empty", () => {
    renderWithProviders(<DatePicker value={null} onChange={vi.fn()} />);
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("formats the selected date for display", () => {
    renderWithProviders(
      <DatePicker value={new Date("2026-07-30T00:00:00")} onChange={vi.fn()} />,
    );
    expect(screen.getByText("30 Jul 2026")).toBeInTheDocument();
  });

  it("clears the value", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <DatePicker
        value={new Date("2026-07-30T00:00:00")}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /clear date/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("offers no clear control when empty", () => {
    renderWithProviders(<DatePicker value={null} onChange={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: /clear date/i }),
    ).not.toBeInTheDocument();
  });
});
