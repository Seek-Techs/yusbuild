import * as React from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { NavList } from "./NavList";

/**
 * Mobile navigation drawer, shown below `lg`.
 *
 * Radix Dialog (which Sheet wraps) handles the focus trap, Escape to close,
 * scroll locking, and `aria-modal` for us.
 *
 * Open state is deliberately local rather than in the UI store: it must not
 * persist across reloads, and only this component needs it.
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { pathname } = useLocation();
  const [lastPathname, setLastPathname] = React.useState(pathname);

  // Close on navigation. Without this the drawer stays open over the page the
  // user just navigated to, which reads as the tap having done nothing.
  //
  // Derived during render rather than in an effect: an effect would let the
  // open drawer paint once over the new route before closing.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4 text-left">
          {/* Radix requires a title for accessible naming. The logo carries the
              visible branding, so the heading itself is visually hidden. */}
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo withText withTagline />
        </SheetHeader>

        <div className="overflow-y-auto p-3">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
