import * as React from "react";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DATE_FORMATS, formatDate } from "@/lib/format/date";

/**
 * Single date picker.
 *
 * Works with react-hook-form via `<Controller>` — it is a controlled component
 * taking `value`/`onChange`:
 *
 *   <FormField
 *     control={form.control}
 *     name="date_installed"
 *     render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>Date installed</FormLabel>
 *         <DatePicker value={field.value} onChange={field.onChange} />
 *         <FormMessage />
 *       </FormItem>
 *     )}
 *   />
 *
 * Serialise with `toApiDate()` on submit — the backend wants `YYYY-MM-DD`.
 */
export interface DatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  /** Display format. The API format is applied at submit, not here. */
  format?: string;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  /** Set by FormControl when validation fails. */
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  format = DATE_FORMATS.display,
  min,
  max,
  disabled = false,
  clearable = true,
  id,
  className,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={aria["aria-invalid"]}
            aria-describedby={aria["aria-describedby"]}
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !value && "text-muted-foreground",
              clearable && value && "pr-9",
              aria["aria-invalid"] && "border-destructive",
            )}
          >
            <CalendarIcon aria-hidden="true" />
            {value ? formatDate(value, format) : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent>
          <Calendar
            mode="single"
            selected={value ?? undefined}
            defaultMonth={value ?? undefined}
            disabled={
              min || max
                ? { before: min as Date, after: max as Date }
                : undefined
            }
            onSelect={(date) => {
              onChange(date ?? null);
              // Close on choose: a single date needs no confirmation step.
              setOpen(false);
            }}
            // Focus moves into the calendar the user just opened, which is
            // where they expect to be — and it is the only way to operate the
            // grid by keyboard. This is the narrow case the rule allows for,
            // not focus stolen on page load.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {clearable && value && !disabled ? (
        // Outside the trigger, or it would be a button nested in a button.
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Clear date"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
