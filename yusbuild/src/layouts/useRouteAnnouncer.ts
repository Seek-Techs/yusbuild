import * as React from "react";
import { useLocation } from "react-router-dom";

import { findNavItemByPath } from "./nav.config";

/**
 * Announce route changes to assistive technology.
 *
 * A single-page navigation replaces the page content without any of the
 * signals a full page load gives a screen reader — no new document, no title
 * announcement, no focus reset. Without this, navigating is completely silent
 * and focus is left wherever the activated link used to be.
 *
 * Returns the message for an `aria-live="polite"` region, plus a ref to place
 * on the main landmark so focus can be moved there.
 */
export function useRouteAnnouncer() {
  const { pathname } = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    // Skip the initial load: the browser already announces the document.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const label = findNavItemByPath(pathname)?.label ?? "Page";
    setAnnouncement(`${label} — navigated`);

    // Move focus to the content region so the next Tab continues from the new
    // page rather than from a link that no longer exists.
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return { announcement, mainRef };
}
