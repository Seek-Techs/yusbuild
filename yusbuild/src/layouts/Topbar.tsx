import { useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Breadcrumbs } from "./Breadcrumbs";
import { MobileNav } from "./MobileNav";

/**
 * Application topbar.
 *
 * Sticky, which only works because the shell now scrolls at the document level
 * — the previous container-scroll model (`overflow-y-auto` on the content
 * pane) silently defeated `position: sticky`.
 */
export function Topbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 h-topbar border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <MobileNav />

        <Logo withText />

        {/* Breadcrumbs render only for nested routes, and only where there is
            room for them. */}
        <Breadcrumbs className="hidden md:block" />

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
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
                  {user?.username ?? "Signed in"}
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

              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
