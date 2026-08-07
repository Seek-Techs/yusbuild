import { useNavigate } from "react-router-dom";
import { Bell, LogIn, LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Breadcrumbs } from "./Breadcrumbs";
import { MobileNav } from "./MobileNav";

/**
 * Application topbar.
 *
 * Solid navy, per the client's design reference.
 *
 * Uses its own `--topbar` token rather than `--primary`: primary inverts to
 * near-white in dark mode, which would turn the navy header into a pale band.
 * The header is a fixed brand surface, so it stays navy in both schemes.
 *
 * Because it sits on a dark field regardless of scheme, every control inside
 * needs explicit light-on-dark treatment — the default ghost button is styled
 * for a light surface and its icon would all but disappear here.
 *
 * Sticky, which only works because the shell scrolls at the document level; a
 * scroll container on the content pane silently defeats `position: sticky`.
 */
export function Topbar() {
  const { logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Shared treatment for controls sitting on the navy field.
  const onNavy =
    "text-topbar-foreground/80 hover:bg-white/10 hover:text-topbar-foreground focus-visible:ring-white/50 focus-visible:ring-offset-topbar";

  return (
    <header className="sticky top-0 z-40 h-topbar bg-topbar text-topbar-foreground">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <MobileNav className={onNavy} />

        <Logo withText onDark />

        {/* Breadcrumbs render only for nested routes, and only where there is
            room for them. */}
        <Breadcrumbs className="hidden md:block" onDark />

        <div className="ml-auto flex items-center gap-1">
          {/* Notifications are on the roadmap. Rendered as a visible but inert
              affordance rather than omitted, so the topbar matches the agreed
              design without implying a feature that does not exist. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-disabled="true"
                onClick={(event) => event.preventDefault()}
                aria-label="Notifications (coming soon)"
                className={onNavy}
              >
                <Bell aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications — coming soon</TooltipContent>
          </Tooltip>

          <ThemeToggle className={onNavy} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${onNavy}`}
                aria-label="Account menu"
              >
                <UserIcon aria-hidden="true" />
                <span className="hidden max-w-32 truncate sm:inline">
                  {user?.username ?? "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-body font-medium">
                  {user?.username ?? "Not signed in"}
                </span>
                {/* Role is shown only when genuinely known. The backend exposes
                    no groups claim today, so asserting one here would state a
                    permission level we cannot verify. */}
                {user?.roles.length ? (
                  <span className="block text-caption capitalize text-muted-foreground">
                    {user.roles.join(", ")}
                  </span>
                ) : null}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* The shell also renders on the public gallery routes, where
                  there is no session. Offering "Sign out" there would be
                  meaningless, so the action follows the actual state. */}
              {isAuthenticated ? (
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => navigate("/login")}>
                  <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
