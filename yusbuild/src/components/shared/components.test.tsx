import { describe, expect, it, vi } from "vitest";
import { Plus } from "lucide-react";

import { renderWithProviders, screen } from "@/test/render";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { makeTestJwt } from "@/test/msw/handlers";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth/token-storage";
import type { NormalizedError } from "@/lib/api/errors";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, ErrorState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { RoleGate } from "./RoleGate";
import { SearchInput } from "./SearchInput";
import { StatCard } from "./StatCard";
import { StatusBadge, type StatusMap } from "./StatusBadge";

describe("StatCard", () => {
  it("renders a ReactNode value", () => {
    // Some tiles show a badge rather than a number; a string-typed value prop
    // would have forced those callers back to hand-written markup.
    renderWithProviders(
      <StatCard label="Status" value={<Badge>Active</Badge>} />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows a skeleton instead of the value while loading", () => {
    renderWithProviders(<StatCard label="Piles" value={42} isLoading />);

    expect(screen.queryByText("42")).not.toBeInTheDocument();
    expect(screen.getByText("Piles")).toBeInTheDocument();
  });

  it("states trend direction in text, not colour alone", () => {
    renderWithProviders(
      <StatCard
        label="Steel"
        value="18.2 t"
        trend={{ value: "12%", direction: "up" }}
      />,
    );

    expect(screen.getByText("Up")).toBeInTheDocument();
  });
});

describe("EmptyState / ErrorState", () => {
  it("marks errors as alerts for assistive technology", () => {
    const error: NormalizedError = {
      kind: "server",
      status: 500,
      message: "Boom.",
      raw: null,
    };

    renderWithProviders(<ErrorState error={error} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom.");
  });

  it("derives its presentation from the error kind", () => {
    const forbidden: NormalizedError = {
      kind: "forbidden",
      status: 403,
      message: "Nope.",
      raw: null,
    };

    renderWithProviders(<ErrorState error={forbidden} />);
    expect(screen.getByText(/do not have access/i)).toBeInTheDocument();
  });

  it("withholds retry for errors that cannot succeed on retry", () => {
    // Retrying a 403 or 409 just reproduces the same answer.
    const conflict: NormalizedError = {
      kind: "conflict",
      status: 409,
      message: "Already submitted.",
      raw: null,
    };

    renderWithProviders(<ErrorState error={conflict} onRetry={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("offers retry for transient failures", () => {
    const server: NormalizedError = {
      kind: "server",
      status: 503,
      message: "Unavailable.",
      raw: null,
    };

    renderWithProviders(<ErrorState error={server} onRetry={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("renders an empty state with its action", () => {
    renderWithProviders(
      <EmptyState title="No piles yet" action={<Button>New pile</Button>} />,
    );

    expect(screen.getByText("No piles yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New pile" }),
    ).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  const MAP: StatusMap = {
    ACTIVE: { label: "Active", tone: "success" },
    ON_HOLD: { label: "On hold", tone: "warning" },
  };

  it("renders the mapped label", () => {
    renderWithProviders(<StatusBadge status="ON_HOLD" map={MAP} />);
    expect(screen.getByText("On hold")).toBeInTheDocument();
  });

  it("humanizes an unmapped status rather than crashing", () => {
    // The backend can add a status value at any time.
    renderWithProviders(<StatusBadge status="AWAITING_REVIEW" map={MAP} />);
    expect(screen.getByText("Awaiting review")).toBeInTheDocument();
  });

  it("renders nothing for a missing status", () => {
    const { container } = renderWithProviders(
      <StatusBadge status={null} map={MAP} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("SearchInput", () => {
  it("is labelled even though it only shows a placeholder", () => {
    renderWithProviders(<SearchInput value="" onChange={vi.fn()} />);
    expect(
      screen.getByRole("searchbox", { name: "Search" }),
    ).toBeInTheDocument();
  });

  it("clears via the clear button", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <SearchInput value="P-01" onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("hides the clear button when empty", () => {
    renderWithProviders(<SearchInput value="" onChange={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: /clear search/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = renderWithProviders(
      <Pagination page={1} count={12} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("disables previous on the first page and next on the last", () => {
    const { rerender } = renderWithProviders(
      <Pagination page={1} count={120} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    rerender(<Pagination page={3} count={120} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("clamps a page beyond the end of the results", () => {
    // A shared link can carry a page that no longer exists — the result set may
    // have shrunk, or the recipient may see fewer rows. Without the clamp this
    // reports "Showing 301–350 of 40" and disables both controls, leaving the
    // user stuck.
    renderWithProviders(
      <Pagination page={7} count={120} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText(/page 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeEnabled();
  });

  it("reports the visible range", () => {
    renderWithProviders(
      <Pagination page={2} count={120} onPageChange={vi.fn()} />,
    );
    // Page size is fixed at 50 server-side.
    expect(screen.getByText(/showing/i)).toHaveTextContent("51");
    expect(screen.getByText(/showing/i)).toHaveTextContent("100");
  });
});

describe("ConfirmDialog", () => {
  it("gates confirmation behind the typed challenge", async () => {
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Lock package"
        confirmLabel="Lock"
        requireTypedConfirmation="LOCK"
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Lock" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "LOCK");
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("confirms directly when no challenge is required", async () => {
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Submit record"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe("RoleGate", () => {
  function renderGate(ui: React.ReactNode, { signedIn = true } = {}) {
    if (signedIn) {
      window.localStorage.setItem(
        ACCESS_TOKEN_KEY,
        makeTestJwt({ user_id: 1 }),
      );
      window.localStorage.setItem(
        REFRESH_TOKEN_KEY,
        makeTestJwt({ token_type: "refresh" }),
      );
    }
    return renderWithProviders(
      <AuthProvider>
        <TooltipProvider>{ui}</TooltipProvider>
      </AuthProvider>,
    );
  }

  it("fails closed while roles are unknown", () => {
    // The backend exposes no groups claim, so granting write affordances would
    // assert a permission level we cannot verify.
    renderGate(
      <RoleGate label={<>New pile</>}>
        <Button>
          <Plus /> New pile
        </Button>
      </RoleGate>,
    );

    const control = screen.getByRole("button", { name: /new pile/i });
    expect(control).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps the disabled stand-in focusable so its tooltip is reachable", async () => {
    // A `disabled` button leaves the tab order entirely, so a keyboard user
    // would meet an unexplained dead control.
    const { user } = renderGate(
      <RoleGate label={<>New pile</>}>
        <Button>New pile</Button>
      </RoleGate>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: /new pile/i })).toHaveFocus();
  });

  it("renders the fallback in hide mode", () => {
    renderGate(
      <RoleGate mode="hide" fallback={<span>Read only</span>}>
        <Button>New pile</Button>
      </RoleGate>,
    );

    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /new pile/i }),
    ).not.toBeInTheDocument();
  });
});
