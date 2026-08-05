/**
 * Quantity formatting.
 *
 * Lifted out of the prototype's data module — which will be deleted — and
 * corrected: it emitted "m3" rather than the "m³" an engineering document
 * expects.
 *
 * Everything is locale-aware via Intl and tolerates null, undefined and NaN,
 * returning the em dash rather than "NaN kg".
 */

import { EMPTY_VALUE } from "./date";

type NumberInput = number | string | null | undefined;

function parse(value: NumberInput): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNumber(
  value: NumberInput,
  { maximumFractionDigits = 2, minimumFractionDigits = 0 } = {},
): string {
  const parsed = parse(value);
  if (parsed === null) return EMPTY_VALUE;

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(parsed);
}

/** Steel mass, e.g. "27,823.32 kg". */
export function formatKg(value: NumberInput): string {
  const formatted = formatNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatted === EMPTY_VALUE ? formatted : `${formatted} kg`;
}

/** Steel mass in tonnes, e.g. "27.82 t". */
export function formatTons(value: NumberInput): string {
  const formatted = formatNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatted === EMPTY_VALUE ? formatted : `${formatted} t`;
}

/** Concrete volume, e.g. "174.720 m³". Note the superscript. */
export function formatM3(value: NumberInput): string {
  const formatted = formatNumber(value, {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  });
  return formatted === EMPTY_VALUE ? formatted : `${formatted} m³`;
}

/** Millimetres, for pile diameters and bar sizes. */
export function formatMm(value: NumberInput): string {
  const formatted = formatNumber(value, { maximumFractionDigits: 0 });
  return formatted === EMPTY_VALUE ? formatted : `${formatted} mm`;
}

/** Metres, for pile lengths. */
export function formatMetres(value: NumberInput): string {
  const formatted = formatNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
  });
  return formatted === EMPTY_VALUE ? formatted : `${formatted} m`;
}

/**
 * Locale for currency, deliberately pinned rather than left to the browser.
 *
 * Every other formatter here passes `undefined` so numbers and dates follow the
 * reader's own locale — correct, since those are neutral quantities. Currency
 * is different: with an undefined locale a browser set to en-IN renders
 * ₦21,600,000 as "NGN 2.2Cr" (crore, with lakh grouping) rather than "₦21.6M",
 * and drops the ₦ symbol entirely. Contract values must read the same to every
 * user, so the locale is fixed.
 */
const CURRENCY_LOCALE = "en-NG";

/**
 * Currency, e.g. "₦21.6M" or "₦21,600,000".
 *
 * Defaults to Naira: YusBuild is a Nigerian construction platform and every
 * cost figure in the product design is in ₦. Pass `currency` for anything else.
 *
 * `compact` is for headline figures on stat tiles, where "₦21.6M" reads far
 * better than "₦21,600,000". Use the full form in tables, where the exact
 * number is the point.
 */
export function formatCurrency(
  value: NumberInput,
  {
    currency = "NGN",
    compact = false,
    locale = CURRENCY_LOCALE,
    maximumFractionDigits = compact ? 1 : 0,
  }: {
    currency?: string;
    compact?: boolean;
    locale?: string;
    maximumFractionDigits?: number;
  } = {},
): string {
  const parsed = parse(value);
  if (parsed === null) return EMPTY_VALUE;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits,
  }).format(parsed);
}

/** Percentage, e.g. "74%". Expects 0–100, not 0–1. */
export function formatPercent(value: NumberInput): string {
  const formatted = formatNumber(value, { maximumFractionDigits: 1 });
  return formatted === EMPTY_VALUE ? formatted : `${formatted}%`;
}
