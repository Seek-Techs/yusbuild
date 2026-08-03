import { setupServer } from "msw/node";

import { handlers } from "./handlers";

/**
 * Shared MSW server. Lifecycle is managed in src/test/setup.ts, so tests only
 * need `server.use(...)` to override a handler for a single case.
 */
export const server = setupServer(...handlers);
