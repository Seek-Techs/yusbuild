import { NavLink } from "react-router-dom";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge, enabled: true },
  { label: "Projects", to: "/projects", icon: FolderKanban, enabled: true },
  { label: "Piles", to: "/piles", icon: Boxes, enabled: true },
  { label: "Execution", to: "/execution", icon: ClipboardCheck, enabled: false },
  { label: "Evidence", to: "/evidence", icon: UploadCloud, enabled: false },
  { label: "Verification", to: "/verification", icon: ShieldCheck, enabled: false },
  { label: "Approvals", to: "/approvals", icon: BadgeCheck, enabled: false },
  { label: "Certification", to: "/certification", icon: FileCheck2, enabled: false },
  { label: "Audit", to: "/audit", icon: History, enabled: false },
];

export function Sidebar() {
  return (
    <aside className="border-border border-b bg-card px-4 py-6 lg:border-b-0 lg:border-r lg:w-72 lg:px-6 lg:py-8">
      <div className="space-y-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Navigation
        </div>
        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <Button
              key={item.label}
              asChild={item.enabled}
              variant="ghost"
              size="default"
              disabled={!item.enabled}
              className="justify-start rounded-md px-3 text-left text-sm text-foreground"
            >
              {item.enabled ? (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-accent/10 text-primary",
                    )
                  }
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              ) : (
                <>
                  <item.icon />
                  {item.label}
                </>
              )}
            </Button>
          ))}
        </nav>
        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          Primary workflow: projects, pile records, calculation review, and BOQ
          export.
        </div>
      </div>
    </aside>
  );
}
