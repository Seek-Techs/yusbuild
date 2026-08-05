import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

import { server } from "./msw/server";

// vitest-axe ships an `extend-expect` entry point, but it is empty in this
// version — importing it registers nothing and every assertion fails with
// "Invalid Chai property". Registering the matchers directly is the supported
// path and does not depend on that file.
expect.extend(axeMatchers);

/**
 * Global test setup.
 *
 * The two stubs below are not optional. jsdom implements neither API, and both
 * failures are cryptic:
 *   - `matchMedia` is used by ThemeProvider (system colour-scheme detection)
 *     and by useMediaQuery. Without it, rendering the shell throws.
 *   - `ResizeObserver` is required by Recharts' ResponsiveContainer and by
 *     several Radix primitives. Without it, any chart test fails inside
 *     third-party code with no useful stack.
 */

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }),
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Radix uses these for positioning/scroll-locking; jsdom lacks them.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
if (!globalThis.DOMRect) {
  globalThis.DOMRect = class DOMRect {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0,
    ) {}
    top = 0;
    left = 0;
    right = 0;
    bottom = 0;
    toJSON() {
      return this;
    }
    static fromRect(rect?: DOMRectInit) {
      return new DOMRect(rect?.x, rect?.y, rect?.width, rect?.height);
    }
  } as unknown as typeof DOMRect;
}

// `onUnhandledRequest: "error"` is deliberate: a request with no handler is
// almost always a test that is silently hitting the network or a typo'd path.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
  window.localStorage.clear();
});

afterAll(() => server.close());
