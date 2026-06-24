import * as React from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ContentLayout } from "./ContentLayout";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col">
        <Topbar />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Sidebar />
          <ContentLayout>{children}</ContentLayout>
        </div>
      </div>
    </div>
  );
}
