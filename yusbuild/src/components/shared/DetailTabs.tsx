import * as React from "react";
import { parseAsString, useQueryState } from "nuqs";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Tabs for a detail screen, with the active tab held in the URL.
 *
 * URL-synced for the same reason list state is: a colleague should be able to
 * send a link to the BOQ tab of a project, not just to the project. It also
 * means a reload keeps the reader where they were.
 *
 *   <DetailTabs
 *     tabs={[
 *       { value: "piles",     label: "Piles",     content: <PilesTable /> },
 *       { value: "boq",       label: "BOQ",       content: <BoqSummary /> },
 *       { value: "documents", label: "Documents", content: <Documents /> },
 *     ]}
 *   />
 */
export interface DetailTab {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  /** Small count or status shown after the label. */
  badge?: React.ReactNode;
}

export interface DetailTabsProps {
  tabs: DetailTab[];
  /** Query parameter holding the active tab. Change it if a screen has two. */
  paramKey?: string;
  /** Defaults to the first tab. */
  defaultValue?: string;
  className?: string;
}

export function DetailTabs({
  tabs,
  paramKey = "tab",
  defaultValue,
  className,
}: DetailTabsProps) {
  const fallback = defaultValue ?? tabs[0]?.value ?? "";

  const [active, setActive] = useQueryState(
    paramKey,
    // `history: "replace"` — flipping between tabs should not fill the back
    // stack, so Back leaves the record rather than walking tab by tab.
    parseAsString.withDefault(fallback).withOptions({ history: "replace" }),
  );

  // A URL can name a tab that no longer exists, e.g. an old link after a tab
  // was renamed. Fall back rather than rendering an empty panel.
  const value = tabs.some((tab) => tab.value === active) ? active : fallback;

  return (
    <Tabs
      value={value}
      onValueChange={(next) => void setActive(next === fallback ? null : next)}
      className={cn("w-full", className)}
    >
      <TabsList className="max-w-full overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}
            {tab.badge}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
