import * as React from "react";

interface ContentLayoutProps {
  children: React.ReactNode;
}

export function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}
