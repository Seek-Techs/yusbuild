import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { NavList } from "./NavList";

/**
 * Desktop sidebar.
 *
 * Hidden below `lg`, where navigation moves into the Sheet drawer in
 * MobileNav. Previously this stacked as a full-width block on small screens,
 * pushing page content roughly 500px down the page.
 *
 * Collapse state is persisted in the UI store, which only works because the
 * shell no longer remounts on every navigation.
 */
export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r bg-card lg:flex lg:flex-col",
        // Sticky under the topbar with its own scroll region, so a long nav
        // never pushes the page and the rail stays visible while reading.
        "sticky top-topbar h-[calc(100svh-theme(spacing.topbar))]",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        {!collapsed ? (
          <p className="px-3 pb-2 pt-1 text-overline text-muted-foreground">
            Navigation
          </p>
        ) : null}
        <NavList collapsed={collapsed} />
      </div>

      <div className="border-t p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon-sm" : "sm"}
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className={cn(
                "text-muted-foreground",
                collapsed ? "w-full" : "w-full justify-start",
              )}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" />
              ) : (
                <>
                  <PanelLeftClose aria-hidden="true" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed ? (
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          ) : null}
        </Tooltip>
      </div>
    </aside>
  );
}
