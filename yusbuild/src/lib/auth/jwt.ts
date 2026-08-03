/**
 * Minimal JWT payload decoder — no dependency.
 *
 * SimpleJWT access tokens are unencrypted (signed) JWTs. We only need to read
 * the `user_id` claim to give the frontend User a real backend primary key.
 * This does NOT verify the signature (the server does that on every request);
 * it only decodes the payload for display/identity purposes.
 */

export type JwtPayload = {
  user_id?: number;
  token_type?: string;
  exp?: number;
  [key: string]: unknown;
};

const base64UrlDecode = (segment: string): string => {
  // Convert base64url → base64, then decode.
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return atob(padded);
};

export const decodeJwt = (token: string): JwtPayload | null => {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return null;
  }

  try {
    const json = base64UrlDecode(payloadSegment);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};
