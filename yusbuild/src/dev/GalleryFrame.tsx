import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";
import { SCREENS } from "./screens";

/** Chrome for the component gallery: a banner and a switcher between screens. */
export function GalleryFrame() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed bg-muted/40 p-3">
        <p className="text-body font-medium">Component gallery</p>
        <p className="text-caption text-muted-foreground">
          The client design reference, built only from{" "}
          <code className="rounded bg-muted px-1">@/components/shared</code>.
          Not part of the application, and excluded from production builds.
        </p>

        <nav aria-label="Gallery screens" className="mt-3 flex flex-wrap gap-2">
          {SCREENS.map((screen) => (
            <NavLink
              key={screen.path}
              to={`/_dev/${screen.path}`}
              className={({ isActive }) =>
                cn(
                  "rounded-md border px-3 py-1.5 text-caption font-medium transition-colors",
                  isActive
                    ? "border-brand bg-brand-muted text-brand-muted-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              {screen.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
