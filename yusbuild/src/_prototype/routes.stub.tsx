/**
 * Production stub for the prototype routes.
 *
 * `vite.config.ts` aliases `@/_prototype/routes` to this file for production
 * builds, so the reference screens and their fixture data never reach the
 * shipped bundle. The router only mounts these routes under
 * `import.meta.env.DEV` anyway; this stub is what makes that guarantee hold at
 * the bundler level rather than just at runtime.
 */
export function PrototypeRoutes() {
  return null;
}
