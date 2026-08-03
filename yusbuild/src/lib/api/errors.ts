import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { getHttpStatus } from "./status";

/**
 * Error normalization.
 *
 * The backend emits five structurally different error bodies, and three of them
 * omit `status_code`. Every consumer would otherwise have to know which
 * endpoint produced which shape, so everything funnels through here.
 *
 *   A  { error, detail, status_code }                    global handler
 *   B  { error:"ValidationError", detail, errors, … }    serializer validation
 *   C  { detail }                                        hand-rolled 409s
 *   D  { error, detail }                                 piles recalculate
 *   E  { field: [messages] }                             bare DRF field errors
 *
 * Three rules that are easy to get wrong:
 *
 * 1. Never trust `status_code` from the body — shapes C, D and E omit it.
 *    `kind` is always derived from the HTTP status.
 * 2. Blob responses (CSV/XLSX exports use responseType: "blob") deliver the
 *    JSON body as a Blob. It must be read back to text before parsing, or the
 *    UI renders "[object Blob]".
 * 3. `message` is never empty. A blank error toast is worse than a generic one.
 */

export type ErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "server"
  | "network"
  | "unknown";

export interface NormalizedError {
  kind: ErrorKind;
  /** HTTP status, or undefined for network/timeout failures. */
  status?: number;
  /** Always populated and safe to show a user. */
  message: string;
  /** The backend's `detail` string, when it sent one. */
  detail?: string;
  /** Field-keyed messages from a 400. Feed to applyFieldErrors. */
  fieldErrors?: Record<string, string[]>;
  /** The `error` discriminator, e.g. "ValidationError". */
  code?: string;
  raw?: unknown;
}

/** DRF's key for validation errors that belong to no single field. */
export const NON_FIELD_ERRORS_KEY = "non_field_errors";

const DEFAULT_MESSAGES: Record<ErrorKind, string> = {
  validation: "Please correct the highlighted fields and try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You do not have permission to do this.",
  notFound: "We could not find what you were looking for.",
  conflict: "This action conflicts with the current state of the record.",
  server: "Something went wrong on our end. Please try again.",
  network: "We could not reach the server. Check your connection.",
  unknown: "Something went wrong. Please try again.",
};

function kindFromStatus(status: number | undefined): ErrorKind {
  if (status === undefined) return "network";
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404 || status === 410) return "notFound";
  if (status === 409) return "conflict";
  if (status >= 500) return "server";
  return "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when every value is an array of strings — DRF's field-error shape. */
function looksLikeFieldErrors(
  value: unknown,
): value is Record<string, string[]> {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  if (entries.length === 0) return false;
  return entries.every(
    ([, messages]) =>
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages.every((m) => typeof m === "string"),
  );
}

/** Drop fields whose message list is empty so callers can trust the shape. */
function compactFieldErrors(
  errors: Record<string, string[]>,
): Record<string, string[]> | undefined {
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(errors)) {
    if (messages.length > 0) result[field] = messages;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Build a human-readable summary from field errors, for cases where there is
 * no form to attach them to (a toast, say).
 */
function summarizeFieldErrors(
  fieldErrors: Record<string, string[]>,
): string | undefined {
  const nonField = fieldErrors[NON_FIELD_ERRORS_KEY];
  if (nonField?.[0]) return nonField[0];

  const first = Object.entries(fieldErrors)[0];
  if (!first) return undefined;
  const [field, messages] = first;
  return messages[0] ? `${field}: ${messages[0]}` : undefined;
}

/** Extract the response body from an axios-shaped error. */
function extractBody(error: unknown): unknown {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (isRecord(response) && "data" in response) return response.data;
  return undefined;
}

/**
 * Normalize any thrown value into a NormalizedError.
 *
 * Synchronous. For blob-bodied errors (CSV/XLSX exports) use
 * `normalizeApiErrorAsync`, which can read the Blob first.
 */
export function normalizeApiError(error: unknown): NormalizedError {
  // A value that has already been normalized passes straight through.
  if (isNormalizedError(error)) return error;

  const status = getHttpStatus(error);
  const kind = kindFromStatus(status);
  const body = extractBody(error);

  const base: NormalizedError = {
    kind,
    ...(status !== undefined ? { status } : {}),
    message: DEFAULT_MESSAGES[kind],
    raw: error,
  };

  if (!isRecord(body)) {
    // No parseable body: fall back to the transport-level message if it is
    // meaningful, otherwise the status default.
    const transportMessage =
      error instanceof Error && kind === "network" ? error.message : undefined;
    return transportMessage
      ? { ...base, message: transportMessage, detail: transportMessage }
      : base;
  }

  const code = typeof body.error === "string" ? body.error : undefined;
  const detail = typeof body.detail === "string" ? body.detail : undefined;

  // Shape B: field errors nested under `errors`.
  let fieldErrors: Record<string, string[]> | undefined;
  if (looksLikeFieldErrors(body.errors)) {
    fieldErrors = compactFieldErrors(body.errors);
  } else if (!detail && !code && looksLikeFieldErrors(body)) {
    // Shape E: the body IS the field-error map.
    fieldErrors = compactFieldErrors(body);
  }

  // Prefer the most specific message available. "Validation failed" is the
  // backend's generic wrapper, so a field message beats it.
  const fieldSummary = fieldErrors
    ? summarizeFieldErrors(fieldErrors)
    : undefined;
  const isGenericDetail = detail === "Validation failed";
  const message =
    (isGenericDetail ? fieldSummary : detail) ??
    fieldSummary ??
    detail ??
    DEFAULT_MESSAGES[kind];

  return {
    ...base,
    message,
    ...(detail !== undefined ? { detail } : {}),
    ...(code !== undefined ? { code } : {}),
    ...(fieldErrors !== undefined ? { fieldErrors } : {}),
  };
}

/**
 * Async normalizer that also handles blob-bodied errors.
 *
 * Requests made with `responseType: "blob"` (the CSV and XLSX exports) deliver
 * even error bodies as a Blob, so the JSON has to be read back out before any
 * shape matching can happen.
 */
export async function normalizeApiErrorAsync(
  error: unknown,
): Promise<NormalizedError> {
  const body = extractBody(error);

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    try {
      const text = await body.text();
      const parsed: unknown = JSON.parse(text);
      // Re-shape into something the synchronous normalizer understands.
      const rehydrated = isRecord(error)
        ? {
            ...error,
            response: { ...(error.response as object), data: parsed },
          }
        : error;
      return normalizeApiError(rehydrated);
    } catch {
      // Not JSON — fall through to the generic path.
    }
  }

  return normalizeApiError(error);
}

export function isNormalizedError(value: unknown): value is NormalizedError {
  return (
    isRecord(value) &&
    typeof value.kind === "string" &&
    typeof value.message === "string" &&
    "raw" in value
  );
}

export interface ApplyFieldErrorsOptions<T extends FieldValues> {
  /**
   * Where to put errors that match no form field — including DRF's
   * `non_field_errors`. Defaults to `root`, which react-hook-form exposes as a
   * form-level error rather than attaching it to a nonexistent input.
   */
  fallbackField?: Path<T> | "root";
  /** Field names the form actually owns. Anything else goes to the fallback. */
  knownFields?: Path<T>[];
}

/**
 * Push backend validation errors into a react-hook-form instance.
 *
 * This is what makes "surface backend validation errors into form fields" a
 * one-liner at the call site:
 *
 *   catch (error) {
 *     const normalized = normalizeApiError(error);
 *     applyFieldErrors(normalized, form.setError);
 *   }
 *
 * Errors that belong to no field (DRF's `non_field_errors`, or a field the form
 * does not render) are routed to `root` so they can be shown as a form-level
 * message instead of being silently dropped.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: NormalizedError,
  setError: UseFormSetError<T>,
  options: ApplyFieldErrorsOptions<T> = {},
): void {
  const { fallbackField = "root", knownFields } = options;

  if (!error.fieldErrors) {
    setError(fallbackField as Path<T>, {
      type: "server",
      message: error.message,
    });
    return;
  }

  const unattached: string[] = [];

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const message = messages.join(" ");
    if (!message) continue;

    const isNonField = field === NON_FIELD_ERRORS_KEY;
    const isUnknown = knownFields
      ? !knownFields.includes(field as Path<T>)
      : false;

    if (isNonField || isUnknown) {
      unattached.push(message);
      continue;
    }

    setError(field as Path<T>, { type: "server", message });
  }

  if (unattached.length > 0) {
    setError(fallbackField as Path<T>, {
      type: "server",
      message: unattached.join(" "),
    });
  }
}
