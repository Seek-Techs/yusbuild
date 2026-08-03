import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHasRole, WRITE_ROLES } from "@/hooks/useRole";
import type { UserRole } from "@/types/auth";

/**
 * Role-aware affordances.
 *
 * IMPORTANT — this is affordance, not authorization. Hiding or disabling a
 * control is a usability courtesy; the backend is the only authority. Every
 * screen must still handle a 403 on the response, because a stale or
 * determined client can always issue the request.
 *
 * The predicates live in @/hooks/useRole. See the note there on why this
 * currently fails closed.
 */

export interface RoleGateProps {
  /** The control shown when the user is permitted. */
  children: React.ReactNode;
  /** Roles allowed through. Defaults to the write roles. */
  roles?: UserRole[];
  /**
   * `disable` keeps a visible, inert stand-in so the action's existence stays
   * discoverable — usually the better choice. `hide` removes it entirely, for
   * cases where its presence would only confuse.
   */
  mode?: "disable" | "hide";
  /**
   * Label for the inert stand-in rendered in `disable` mode. Give it the same
   * text as the real control, e.g. `label={<><Plus /> New pile</>}`. Falls back
   * to `children`, which is right for plain-text controls but will produce
   * nested interactive elements if children contain a button or link.
   */
  label?: React.ReactNode;
  /** Explains why the control is unavailable. */
  tooltip?: string;
  /** Rendered instead of children when `mode` is "hide". */
  fallback?: React.ReactNode;
}

export function RoleGate({
  children,
  roles = WRITE_ROLES,
  mode = "disable",
  label,
  tooltip = "You do not have permission to do this",
  fallback = null,
}: RoleGateProps) {
  const allowed = useHasRole(...roles);

  if (allowed) return <>{children}</>;
  if (mode === "hide") return <>{fallback}</>;

  return (
    <Tooltip>
      {/*
       * `children` is replaced rather than wrapped. Wrapping is what most
       * implementations do, and it is wrong twice over: the wrapped control is
       * usually a <button>, so a focusable wrapper nests interactive elements
       * (invalid HTML, and confusing to a screen reader); and if the wrapper is
       * non-interactive instead, it needs a tabindex that assistive technology
       * has no reason to expect.
       *
       * A single real button carries the disabled state, stays focusable so the
       * tooltip can explain itself, and renders the original label inside.
       */}
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          // A disabled-looking control must not act, but must stay focusable —
          // hence aria-disabled and a no-op handler rather than the `disabled`
          // attribute, which would remove it from the tab order entirely.
          onClick={(event) => event.preventDefault()}
          className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md px-4 py-2 text-body font-medium opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {label ?? children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
