import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Filter controls for a list screen.
 *
 * All state belongs to `useDataTableParams`, so filters live in the URL and a
 * filtered view is shareable. In the prototype these controls were static
 * markup with no handlers — they looked functional and filtered nothing.
 */

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectProps {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  /** Label for the "no filter" choice, e.g. "All projects". */
  allLabel?: string;
  className?: string;
}

/** Radix Select has no empty-string value, so this stands in for "no filter". */
const ALL_VALUE = "__all__";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
  className,
}: FilterSelectProps) {
  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
    >
      <SelectTrigger
        aria-label={label}
        className={cn("h-10 w-auto min-w-36 gap-2", className)}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface FilterBarProps {
  /** Typically a <SearchInput/>. */
  search?: React.ReactNode;
  /** One or more <FilterSelect/>. */
  filters?: React.ReactNode;
  /** Right-aligned page actions, e.g. "New pile" or "Export CSV". */
  actions?: React.ReactNode;
  /** Drives the "Clear all" affordance; from useDataTableParams. */
  activeFilterCount?: number;
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({
  search,
  filters,
  actions,
  activeFilterCount = 0,
  onClearAll,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {search ? (
          <div className="min-w-48 flex-1 md:max-w-sm">{search}</div>
        ) : null}
        {filters}

        {activeFilterCount > 0 && onClearAll ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground"
          >
            <X aria-hidden="true" />
            Clear
            <span className="sr-only"> all {activeFilterCount} filters</span>
          </Button>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
