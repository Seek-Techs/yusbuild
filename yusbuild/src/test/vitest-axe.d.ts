import "vitest";

/**
 * Types for the `toHaveNoViolations` matcher.
 *
 * vitest-axe registers the matcher at runtime (see src/test/setup.ts) but its
 * shipped type augmentation does not reach Vitest 4's Assertion interface, so
 * TypeScript reports the matcher as missing even though the tests pass.
 */
declare module "vitest" {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
