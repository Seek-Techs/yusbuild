import * as React from "react";

import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="border-border flex items-center justify-between border-b bg-background px-4 py-4 shadow-sm sm:px-6 lg:px-8">
      <div>
        <p className="text-lg font-semibold tracking-tight text-foreground">YusBuild</p>
        <p className="text-sm text-muted-foreground">Frontend layout foundation</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
          Notifications
        </Button>
        <div className="rounded-full border border-input bg-secondary px-3 py-2 text-sm text-muted-foreground">
          User
        </div>
      </div>
    </header>
  );
}
