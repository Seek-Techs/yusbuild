import type { RouteObject } from "react-router-dom";

import { GalleryFrame } from "./GalleryFrame";
import { SCREENS } from "./screens";

/**
 * Component gallery — development only.
 *
 * Reproduces the client's design reference using nothing but the shared
 * component library, so the two can be held side by side. It serves three
 * purposes:
 *
 *  1. Proves the library can express the agreed design.
 *  2. Shows domain teams the intended composition for their screens.
 *  3. Surfaces every component in a real arrangement rather than in isolation,
 *     which is where spacing and colour problems actually show up.
 *
 * Excluded from production builds — see vite.config.ts, which aliases this
 * module to a stub. Add screens here rather than in `features/`, so nothing
 * demo-only can be imported by real code.
 */

export const devRoutes: RouteObject[] = [
  {
    path: "_dev",
    element: <GalleryFrame />,
    handle: { crumb: () => ({ label: "Gallery" }) },
    children: SCREENS.map((screen) => ({
      path: screen.path,
      element: screen.element,
      handle: { crumb: () => ({ label: screen.label }) },
    })),
  },
];
