import {
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  FileCheck2,
  FolderKanban,
  Gauge,
  History,
  ShieldCheck,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/types/auth";

/**
 * Navigation configuration — the single source of truth for the app's modules.
 *
 * Consumed by the desktop sidebar, the mobile drawer, the breadcrumb trail, and
 * the router's placeholder routes. Previously these were two hand-maintained
 * lists (nav items in Sidebar.tsx, routes in routes/index.tsx) that could drift
 * apart silently.
 */

export type NavStatus =
  /** Built and navigable. */
  | "available"
  /** On the roadmap. Rendered as a real, focusable link to a placeholder. */
  | "roadmap";

export interface NavItem {
  /** Stable identifier, also used as the React key. */
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  status: NavStatus;
  /**
   * Roles that may see this item. Undefined means everyone.
   *
   * This is an affordance only — hiding a link is not access control. The
   * backend remains the authority, and every screen must still handle a 403.
   */
  roles?: UserRole[];
  /** Short explanation shown in a tooltip for roadmap items. */
  hint?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: Gauge,
    status: "roadmap",
  },
  {
    key: "projects",
    label: "Projects",
    to: "/projects",
    icon: FolderKanban,
    status: "roadmap",
  },
  {
    key: "piles",
    label: "Piles",
    to: "/piles",
    icon: Boxes,
    status: "roadmap",
  },
  {
    key: "execution",
    label: "Execution",
    to: "/execution",
    icon: ClipboardCheck,
    status: "roadmap",
    hint: "Driving records and submissions",
  },
  {
    key: "evidence",
    label: "Evidence",
    to: "/evidence",
    icon: UploadCloud,
    status: "roadmap",
    hint: "Site photos and supporting documents",
  },
  {
    key: "verification",
    label: "Verification",
    to: "/verification",
    icon: ShieldCheck,
    status: "roadmap",
    hint: "Variance checks and flags",
  },
  {
    key: "approvals",
    label: "Approvals",
    to: "/approvals",
    icon: BadgeCheck,
    status: "roadmap",
    hint: "Review and sign-off",
  },
  {
    key: "certification",
    label: "Certification",
    to: "/certification",
    icon: FileCheck2,
    status: "roadmap",
    hint: "Certified quantity packages",
  },
  {
    key: "audit",
    label: "Audit",
    to: "/audit",
    icon: History,
    status: "roadmap",
    hint: "Event timeline",
  },
];

/** Items the current user may see. Affordance only — see NavItem.roles. */
export function visibleNavItems(roles: UserRole[] = []): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((role) => roles.includes(role)),
  );
}

/**
 * The nav item matching a pathname, preferring the longest match so
 * `/projects/12/boq` resolves to Projects rather than to a shorter prefix.
 */
export function findNavItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  ).sort((a, b) => b.to.length - a.to.length)[0];
}
