import { NavLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { visibleNavItems, type NavItem } from "./nav.config";

/**
 * The navigation list, shared by the desktop sidebar and the mobile drawer so
 * the markup and active-state logic exist in exactly one place.
 *
 * Roadmap modules render as real, focusable links to a placeholder page rather
 * than `<Button disabled>`. Disabled controls are removed from the tab order,
 * so a keyboard or screen-reader user could never discover why two thirds of
 * the navigation was inert.
 */

export interface NavListProps {
  /** Icon-only rail. Labels move into tooltips. */
  collapsed?: boolean;
  /** Called after a link is activated — used to close the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
}

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isRoadmap = item.status === "roadmap";

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-body font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-brand-muted text-brand-muted-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isRoadmap && !isActive && "opacity-70",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator. A colour change alone is not a sufficient
              distinction, so the rail gets a shape cue too. */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-opacity",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {collapsed ? (
            <span className="sr-only">{item.label}</span>
          ) : (
            <>
              <span className="truncate">{item.label}</span>
              {isRoadmap ? (
                <Badge
                  variant="neutral-soft"
                  className="ml-auto shrink-0 px-1.5 py-0 text-[10px] font-medium"
                >
                  Soon
                </Badge>
              ) : null}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  // Collapsed rail needs the label in a tooltip; roadmap items explain
  // themselves. Otherwise render the bare link — a tooltip on every item is
  // noise.
  const tooltipText = collapsed
    ? [item.label, isRoadmap ? "(coming soon)" : null].filter(Boolean).join(" ")
    : isRoadmap
      ? (item.hint ?? "Coming in an upcoming release")
      : null;

  if (!tooltipText) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

export function NavList({
  collapsed = false,
  onNavigate,
  className,
}: NavListProps) {
  const { user } = useAuth();
  const items = visibleNavItems(user?.roles ?? []);

  return (
    <nav
      aria-label="Main navigation"
      className={cn("flex flex-col gap-1", className)}
    >
      {items.map((item) => (
        <NavItemLink
          key={item.key}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
