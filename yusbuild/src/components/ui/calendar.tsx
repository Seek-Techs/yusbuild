import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

/**
 * Calendar — a thin wrapper over react-day-picker v10.
 *
 * Deliberately uses the library's own stylesheet, themed through its `--rdp-*`
 * custom properties, rather than the `classNames` override map the shadcn
 * calendar uses. That map targets v8's DOM structure, which v10 changed; a
 * copied shadcn calendar renders subtly broken here and the breakage is easy
 * to miss. Theming via CSS variables survives the library's internal changes.
 *
 * The variables are set on the wrapper (see index.css `.rdp-root`) so the
 * calendar picks up light and dark automatically.
 */
export type CalendarProps = DayPickerProps;

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      // Weeks start Monday: this is a construction tool used on site
      // programmes, not a US consumer calendar.
      weekStartsOn={1}
      showOutsideDays
      {...props}
    />
  );
}
