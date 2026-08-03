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

/** Percentage, e.g. "74%". Expects 0–100, not 0–1. */
export function formatPercent(value: NumberInput): string {
  const formatted = formatNumber(value, { maximumFractionDigits: 1 });
  return formatted === EMPTY_VALUE ? formatted : `${formatted}%`;
}
