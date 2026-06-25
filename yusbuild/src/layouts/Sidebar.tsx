import { Button } from "@/components/ui/button";

const navigationItems = [
  "Dashboard",
  "Projects",
  "Piles",
  "Execution",
  "Evidence",
  "Verification",
  "Approvals",
  "Certification",
  "Audit",
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
              key={item}
              variant="ghost"
              size="default"
              className="justify-start rounded-md px-3 text-left text-sm text-foreground"
            >
              {item}
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
