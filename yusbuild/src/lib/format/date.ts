import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

/**
 * Date formatting.
 *
 * Two rules for domain teams:
 *
 * 1. Never call `dayjs()` with an inline format string. Use the constants and
 *    helpers here, so a format change is one edit rather than a grep.
 * 2. Display in local time, always send `API` format to the backend. Site
 *    engineers think in local time; Django's `date_installed` is a plain
 *    `YYYY-MM-DD` date with no timezone.
 *
 * Every helper tolerates null, undefined and unparseable input, returning the
 * em dash rather than "Invalid Date".
 */

export const DATE_FORMATS = {
  /** 30 Jul 2026 */
  display: "DD MMM YYYY",
  /** 30 Jul 2026, 14:05 */
  displayWithTime: "DD MMM YYYY, HH:mm",
  /** What the API accepts and returns for date fields. */
  api: "YYYY-MM-DD",
  time: "HH:mm",
} as const;

/** Shown wherever a value is absent. */
export const EMPTY_VALUE = "—";

type DateInput = string | number | Date | null | undefined;

function parse(value: DateInput) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

export function formatDate(
  value: DateInput,
  format: string = DATE_FORMATS.display,
): string {
  return parse(value)?.format(format) ?? EMPTY_VALUE;
}

export function formatDateTime(value: DateInput): string {
  return formatDate(value, DATE_FORMATS.displayWithTime);
}

/** "3 hours ago" — for audit timelines and calculation history. */
export function formatRelative(value: DateInput): string {
  return parse(value)?.fromNow() ?? EMPTY_VALUE;
}

/** Serialise a Date for the API. Returns undefined so it can be omitted. */
export function toApiDate(value: Date | null | undefined): string | undefined {
  return value ? dayjs(value).format(DATE_FORMATS.api) : undefined;
}

/** Parse an API date string into a Date, e.g. to seed a picker. */
export function fromApiDate(value: string | null | undefined): Date | null {
  return parse(value)?.toDate() ?? null;
}

export { dayjs };
