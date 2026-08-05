import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Badge for a domain status value.
 *
 * Status→appearance maps are DOMAIN-owned, not defined here: the platform must
 * not know what `ACTIVE` or `TYPE_II` mean. Each feature exports its own map
 * and passes it in, which is what keeps the shell free of domain vocabulary.
 *
 *   // features/projects/constants.ts
 *   export const PROJECT_STATUS: StatusMap = {
 *     ACTIVE:    { label: "Active",    tone: "success" },
 *     ON_HOLD:   { label: "On hold",   tone: "warning" },
 *     COMPLETED: { label: "Completed", tone: "info" },
 *     CANCELLED: { label: "Cancelled", tone: "neutral" },
 *   };
 *
 *   <StatusBadge status={project.status} map={PROJECT_STATUS} />
 */

export type StatusTone =
  "neutral" | "brand" | "success" | "warning" | "info" | "destructive";

export interface StatusDescriptor {
  label: string;
  tone: StatusTone;
}

export type StatusMap = Record<string, StatusDescriptor>;

const SOFT_VARIANT: Record<StatusTone, string> = {
  neutral: "neutral-soft",
  brand: "brand-soft",
  success: "success-soft",
  warning: "warning-soft",
  info: "info-soft",
  destructive: "destructive-soft",
};

const SOLID_VARIANT: Record<StatusTone, string> = {
  neutral: "secondary",
  brand: "brand",
  success: "success",
  warning: "warning",
  info: "info",
  destructive: "destructive",
};

/** Turn an unmapped backend value into something readable rather than raw. */
function humanize(status: string): string {
  return status
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export interface StatusBadgeProps {
  status: string | null | undefined;
  map: StatusMap;
  /**
   * Solid reads louder; soft suits dense tables, where a column of saturated
   * pills overwhelms the data. Soft is the default for that reason.
   */
  emphasis?: "soft" | "solid";
  className?: string;
}

export function StatusBadge({
  status,
  map,
  emphasis = "soft",
  className,
}: StatusBadgeProps) {
  if (!status) return null;

  // The backend can add a status value at any time. Falling back to a neutral
  // humanized label keeps an unknown value readable instead of crashing on
  // `undefined.tone` or rendering a raw SCREAMING_SNAKE string.
  const descriptor: StatusDescriptor = map[status] ?? {
    label: humanize(status),
    tone: "neutral",
  };

  const variant =
    emphasis === "solid"
      ? SOLID_VARIANT[descriptor.tone]
      : SOFT_VARIANT[descriptor.tone];

  return (
    <Badge
      variant={variant as never}
      className={cn("whitespace-nowrap", className)}
    >
      {descriptor.label}
    </Badge>
  );
}
